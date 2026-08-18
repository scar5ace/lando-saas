import {
  PageVersionSource,
  ProjectStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { productConfig } from "@/config/product";
import { createLLMProvider } from "@/features/ai";
import { createProjectSlug } from "@/features/projects/slug";
import { db } from "@/lib/db/client";
import {
  parsePageSchema,
  parseStageOnePageSchema,
  stageOnePageSchema,
} from "@/lib/validation/page-schema";
import type { PageSchema } from "@/types/page-schema";

import type {
  CreatedProjectDto,
  ProjectDetailDto,
  ProjectListDto,
  ProjectSummaryDto,
} from "./dto";
import {
  invalidStoredPageError,
  projectNotFoundError,
  ProjectServiceError,
} from "./errors";

const MAX_DATABASE_RETRIES = 5;

type ProjectSummaryRecord = {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  updatedAt: Date;
};

type CapacityClient = Pick<
  Prisma.TransactionClient,
  "project" | "subscription"
>;

function toProjectSummary(project: ProjectSummaryRecord): ProjectSummaryDto {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    status: project.status,
    updatedAt: project.updatedAt.toISOString(),
  };
}

function toInputJson(schema: PageSchema): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(schema)) as Prisma.InputJsonObject;
}

function parseStoredPage(input: unknown): PageSchema {
  try {
    return parsePageSchema(input);
  } catch (error) {
    throw invalidStoredPageError(error);
  }
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function draftRevisionConflictError(cause?: unknown): ProjectServiceError {
  return new ProjectServiceError({
    status: 409,
    apiCode: "CONFLICT",
    message:
      "Черновик изменился до завершения публикации. Сохраните актуальную версию и повторите попытку.",
    cause,
  });
}

function providerName(): string {
  return (process.env.LLM_PROVIDER?.trim().toLowerCase() || "mock").slice(
    0,
    50,
  );
}

async function assertProjectCapacity(
  client: CapacityClient,
  userId: string,
): Promise<void> {
  const now = new Date();
  const [proSubscription, projectCount] = await Promise.all([
    client.subscription.findFirst({
      where: {
        userId,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
      },
      select: { id: true },
    }),
    client.project.count({
      where: { userId, status: { not: ProjectStatus.ARCHIVED } },
    }),
  ]);

  if (!proSubscription && projectCount >= productConfig.freeProjectLimit) {
    throw new ProjectServiceError({
      status: 409,
      apiCode: "CONFLICT",
      message:
        "На тарифе Free можно создать только один проект. Удалите текущий проект или выберите Pro.",
    });
  }
}

export async function listProjectsForUser(
  userId: string,
): Promise<ProjectListDto> {
  const projects = await db.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
    },
  });

  return { projects: projects.map(toProjectSummary) };
}

export async function getProjectForUser(
  userId: string,
  projectId: string,
): Promise<ProjectDetailDto> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      page: {
        select: {
          draftSchema: true,
          draftRevision: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!project) {
    throw projectNotFoundError();
  }
  if (!project.page) {
    throw invalidStoredPageError();
  }

  return {
    project: toProjectSummary(project),
    page: {
      schema: parseStoredPage(project.page.draftSchema),
      revision: project.page.draftRevision,
      publishedAt: project.page.publishedAt?.toISOString() ?? null,
    },
  };
}

export async function deleteProjectForUser(
  userId: string,
  projectId: string,
): Promise<{ projectId: string }> {
  return db.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    if (!project) {
      throw projectNotFoundError();
    }

    // The audit row is intentionally retained after the project relation is
    // set to null by the database. The deleted ID remains in metadata.
    await transaction.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: "project.deleted",
        metadata: {
          deletedProjectId: project.id,
          name: project.name,
          slug: project.slug,
          status: project.status,
        },
      },
    });

    const deleted = await transaction.project.deleteMany({
      where: { id: projectId, userId },
    });
    if (deleted.count !== 1) {
      throw projectNotFoundError();
    }

    return { projectId };
  });
}

export async function createProjectForUser(
  userId: string,
  prompt: string,
): Promise<CreatedProjectDto> {
  // Fast pre-check avoids spending provider capacity for an account already at
  // its limit. The same predicate is checked again inside the transaction.
  await assertProjectCapacity(db, userId);

  const generatedPage = await createLLMProvider().generatePage({ prompt });
  const schema = parsePageSchema(generatedPage);
  const name = schema.site.title.slice(0, 120);
  const schemaJson = toInputJson(schema);
  const selectedProvider = providerName();

  for (let attempt = 0; attempt < MAX_DATABASE_RETRIES; attempt += 1) {
    const slug = createProjectSlug(name);

    try {
      return await db.$transaction(
        async (transaction) => {
          await assertProjectCapacity(transaction, userId);

          const project = await transaction.project.create({
            data: {
              userId,
              name,
              slug,
              status: ProjectStatus.DRAFT,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              updatedAt: true,
            },
          });

          const page = await transaction.page.create({
            data: {
              projectId: project.id,
              draftSchema: schemaJson,
              draftRevision: 0,
            },
            select: { id: true, draftRevision: true },
          });

          await transaction.pageVersion.create({
            data: {
              pageId: page.id,
              schema: schemaJson,
              source: PageVersionSource.AI,
              prompt,
            },
          });

          await transaction.aiUsage.create({
            data: {
              userId,
              projectId: project.id,
              operation: "generatePage",
              provider: selectedProvider,
            },
          });

          await transaction.auditLog.create({
            data: {
              userId,
              projectId: project.id,
              action: "project.created",
              metadata: {
                provider: selectedProvider,
                schemaVersion: schema.schemaVersion,
              },
            },
          });

          return {
            project: toProjectSummary(project),
            page: { revision: page.draftRevision },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        attempt < MAX_DATABASE_RETRIES - 1 &&
        (isPrismaError(error, "P2002") || isPrismaError(error, "P2034"))
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new ProjectServiceError({
    status: 500,
    apiCode: "INTERNAL_ERROR",
    message: "Не удалось подобрать адрес проекта. Попробуйте ещё раз.",
  });
}

export async function updateProjectDraftForUser(
  userId: string,
  projectId: string,
  schemaInput: PageSchema,
  expectedRevision: number,
): Promise<ProjectDetailDto> {
  const schema = parseStageOnePageSchema(schemaInput);
  const schemaJson = toInputJson(schema);

  return db.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        page: {
          select: {
            id: true,
            draftRevision: true,
            publishedAt: true,
          },
        },
      },
    });

    if (!project) {
      throw projectNotFoundError();
    }
    if (!project.page) {
      throw invalidStoredPageError();
    }

    const updatedPage = await transaction.page.updateMany({
      where: {
        id: project.page.id,
        projectId: project.id,
        draftRevision: expectedRevision,
      },
      data: {
        draftSchema: schemaJson,
        draftRevision: { increment: 1 },
      },
    });

    if (updatedPage.count !== 1) {
      throw new ProjectServiceError({
        status: 409,
        apiCode: "CONFLICT",
        message:
          "Черновик уже изменён в другой вкладке. Обновите страницу и повторите правку.",
      });
    }

    const nextRevision = expectedRevision + 1;
    await transaction.pageVersion.create({
      data: {
        pageId: project.page.id,
        schema: schemaJson,
        source: PageVersionSource.MANUAL,
      },
    });

    const updatedAt = new Date();
    const updatedProject = await transaction.project.updateMany({
      where: { id: projectId, userId },
      data: { updatedAt },
    });
    if (updatedProject.count !== 1) {
      throw projectNotFoundError();
    }

    await transaction.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: "page.draft_updated",
        metadata: { revision: nextRevision },
      },
    });

    return {
      project: toProjectSummary({ ...project, updatedAt }),
      page: {
        schema,
        revision: nextRevision,
        publishedAt: project.page.publishedAt?.toISOString() ?? null,
      },
    };
  });
}

export async function publishProjectForUser(
  userId: string,
  projectId: string,
  expectedRevision: number,
): Promise<ProjectDetailDto> {
  for (let attempt = 0; attempt < MAX_DATABASE_RETRIES; attempt += 1) {
    try {
      return await db.$transaction(
        async (transaction) => {
          const project = await transaction.project.findFirst({
            where: { id: projectId, userId },
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              updatedAt: true,
              page: {
                select: {
                  id: true,
                  draftSchema: true,
                  draftRevision: true,
                },
              },
            },
          });

          if (!project) {
            throw projectNotFoundError();
          }
          if (!project.page) {
            throw invalidStoredPageError();
          }
          if (project.page.draftRevision !== expectedRevision) {
            throw draftRevisionConflictError();
          }

          const schema = stageOnePageSchema.parse(
            parseStoredPage(project.page.draftSchema),
          );
          const snapshot = toInputJson(schema);
          const publishedAt = new Date();

          const updatedPage = await transaction.page.updateMany({
            where: {
              id: project.page.id,
              projectId: project.id,
              draftRevision: expectedRevision,
            },
            data: { publishedSchema: snapshot, publishedAt },
          });
          if (updatedPage.count !== 1) {
            throw draftRevisionConflictError();
          }

          await transaction.pageVersion.create({
            data: {
              pageId: project.page.id,
              schema: snapshot,
              source: PageVersionSource.PUBLISH,
            },
          });

          const updatedProject = await transaction.project.updateMany({
            where: { id: projectId, userId },
            data: { status: ProjectStatus.PUBLISHED, updatedAt: publishedAt },
          });
          if (updatedProject.count !== 1) {
            throw projectNotFoundError();
          }

          await transaction.auditLog.create({
            data: {
              userId,
              projectId: project.id,
              action: "project.published",
              metadata: { revision: expectedRevision },
            },
          });

          return {
            project: toProjectSummary({
              ...project,
              status: ProjectStatus.PUBLISHED,
              updatedAt: publishedAt,
            }),
            page: {
              schema,
              revision: expectedRevision,
              publishedAt: publishedAt.toISOString(),
            },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isPrismaError(error, "P2034")) {
        if (attempt < MAX_DATABASE_RETRIES - 1) {
          continue;
        }
        throw draftRevisionConflictError(error);
      }
      throw error;
    }
  }

  throw draftRevisionConflictError();
}

export async function unpublishProjectForUser(
  userId: string,
  projectId: string,
): Promise<ProjectDetailDto> {
  return db.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        page: {
          select: {
            id: true,
            draftSchema: true,
            draftRevision: true,
          },
        },
      },
    });

    if (!project) {
      throw projectNotFoundError();
    }
    if (!project.page) {
      throw invalidStoredPageError();
    }

    const schema = parseStoredPage(project.page.draftSchema);
    const updatedAt = new Date();

    const updatedPage = await transaction.page.updateMany({
      where: { id: project.page.id, projectId: project.id },
      // Keep publishedSchema as a recoverable snapshot; publishedAt is the
      // public visibility boundary.
      data: { publishedAt: null },
    });
    if (updatedPage.count !== 1) {
      throw invalidStoredPageError();
    }

    const updatedProject = await transaction.project.updateMany({
      where: { id: projectId, userId },
      data: { status: ProjectStatus.DRAFT, updatedAt },
    });
    if (updatedProject.count !== 1) {
      throw projectNotFoundError();
    }

    await transaction.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: "project.unpublished",
        metadata: { revision: project.page.draftRevision },
      },
    });

    return {
      project: toProjectSummary({
        ...project,
        status: ProjectStatus.DRAFT,
        updatedAt,
      }),
      page: {
        schema,
        revision: project.page.draftRevision,
        publishedAt: null,
      },
    };
  });
}
