import "dotenv/config";

import { createEmailVerificationToken } from "better-auth/api";

import { Prisma } from "@/generated/prisma/client";
import { PageVersionSource, ProjectStatus } from "@/generated/prisma/enums";
import { MockLLMProvider } from "@/features/ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { parsePageSchema } from "@/lib/validation/page-schema";
import type { PageSchema } from "@/types/page-schema";

const DEMO_USER = {
  name: "Демо-пользователь Lando",
  email: "demo@lando.test",
  password: "Demo-Lando-2026!",
} as const;

const DEMO_PROJECT = {
  name: "Климат Мастер — демонстрационный лендинг",
  slug: "demo-kondicionery-saratov",
} as const;

const DEMO_PROMPT =
  "Создай современный лендинг для мастера по установке кондиционеров в Саратове. Нужны первый экран, преимущества, услуги с ценами, этапы работы, отзывы, FAQ, форма заявки и контакты. Стиль светлый, надёжный и современный, основной цвет синий.";

const DEMO_PUBLISH_MARKER = "lando:development-seed:publish:v1";
const DEMO_PUBLISHED_AT = new Date("2026-07-26T00:00:00.000Z");

function assertDevelopmentSeed(): void {
  const environment = getServerEnv();

  if (environment.NODE_ENV !== "development") {
    throw new Error(
      "Демо-seed разрешён только при NODE_ENV=development. В production и test он намеренно заблокирован.",
    );
  }
  if (environment.LLM_PROVIDER !== "mock") {
    throw new Error(
      "Демо-seed требует LLM_PROVIDER=mock, чтобы не обращаться к платному внешнему AI.",
    );
  }
  if (environment.EMAIL_PROVIDER !== "console") {
    throw new Error(
      "Демо-seed требует EMAIL_PROVIDER=console, чтобы не отправлять реальные письма.",
    );
  }
}

function toInputJson(schema: PageSchema): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(schema)) as Prisma.InputJsonObject;
}

async function ensureDemoUser() {
  let user = await db.user.findUnique({
    where: { email: DEMO_USER.email },
  });

  if (!user) {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        password: DEMO_USER.password,
      },
    });

    user = await db.user.findUnique({
      where: { id: signUpResult.user.id },
    });
  }

  if (!user) {
    throw new Error("Better Auth не создал демонстрационного пользователя.");
  }

  if (!user.emailVerified) {
    const environment = getServerEnv();
    const verificationToken = await createEmailVerificationToken(
      environment.AUTH_SECRET,
      DEMO_USER.email,
      undefined,
      60 * 60,
    );

    await auth.api.verifyEmail({ query: { token: verificationToken } });
  }

  // Reset through Better Auth so the published development credentials remain
  // deterministic without implementing or importing password hashing ourselves.
  await auth.api.requestPasswordReset({
    body: { email: DEMO_USER.email },
  });

  const resetVerification = await db.verification.findFirst({
    where: {
      value: user.id,
      identifier: { startsWith: "reset-password:" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!resetVerification) {
    throw new Error(
      "Better Auth не создал одноразовый token для установки demo-пароля.",
    );
  }

  const resetToken = resetVerification.identifier.slice(
    "reset-password:".length,
  );
  await auth.api.resetPassword({
    body: { newPassword: DEMO_USER.password, token: resetToken },
  });

  // A previously interrupted local seed may have left older reset tokens.
  // None of them should remain usable after deterministic credentials are set.
  await db.verification.deleteMany({
    where: {
      value: user.id,
      identifier: { startsWith: "reset-password:" },
    },
  });

  const credentialAccount = await db.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
      password: { not: null },
    },
    select: { id: true },
  });

  if (!credentialAccount) {
    throw new Error(
      "Better Auth не создал credential-account для demo-пользователя.",
    );
  }

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { name: DEMO_USER.name },
  });

  if (!updatedUser.emailVerified) {
    throw new Error("Email demo-пользователя не был подтверждён Better Auth.");
  }

  return updatedUser;
}

async function upsertPageVersion(
  transaction: Prisma.TransactionClient,
  input: {
    pageId: string;
    schema: Prisma.InputJsonObject;
    source: PageVersionSource;
    prompt: string;
  },
): Promise<void> {
  const existing = await transaction.pageVersion.findFirst({
    where: {
      pageId: input.pageId,
      source: input.source,
      prompt: input.prompt,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (existing) {
    await transaction.pageVersion.update({
      where: { id: existing.id },
      data: { schema: input.schema },
    });
    return;
  }

  await transaction.pageVersion.create({ data: input });
}

async function ensureDemoProject(userId: string) {
  const generated = await new MockLLMProvider().generatePage({
    prompt: DEMO_PROMPT,
    correlationId: "development-seed",
  });
  const schema = parsePageSchema(generated);
  const schemaJson = toInputJson(schema);

  const slugOwner = await db.project.findUnique({
    where: { slug: DEMO_PROJECT.slug },
    select: { userId: true },
  });

  if (slugOwner && slugOwner.userId !== userId) {
    throw new Error(
      `Slug «${DEMO_PROJECT.slug}» уже принадлежит другому пользователю. Seed не будет изменять чужой проект.`,
    );
  }

  return db.$transaction(async (transaction) => {
    const project = await transaction.project.upsert({
      where: { slug: DEMO_PROJECT.slug },
      create: {
        userId,
        name: DEMO_PROJECT.name,
        slug: DEMO_PROJECT.slug,
        status: ProjectStatus.PUBLISHED,
      },
      update: {
        name: DEMO_PROJECT.name,
        status: ProjectStatus.PUBLISHED,
      },
    });

    const page = await transaction.page.upsert({
      where: { projectId: project.id },
      create: {
        projectId: project.id,
        draftSchema: schemaJson,
        publishedSchema: schemaJson,
        publishedAt: DEMO_PUBLISHED_AT,
        draftRevision: 0,
      },
      update: {
        draftSchema: schemaJson,
        publishedSchema: schemaJson,
        publishedAt: DEMO_PUBLISHED_AT,
        draftRevision: 0,
      },
    });

    await upsertPageVersion(transaction, {
      pageId: page.id,
      schema: schemaJson,
      source: PageVersionSource.AI,
      prompt: DEMO_PROMPT,
    });
    await upsertPageVersion(transaction, {
      pageId: page.id,
      schema: schemaJson,
      source: PageVersionSource.PUBLISH,
      prompt: DEMO_PUBLISH_MARKER,
    });

    return project;
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка seed";
}

async function main(): Promise<void> {
  assertDevelopmentSeed();

  const user = await ensureDemoUser();
  const project = await ensureDemoProject(user.id);
  const appUrl = getServerEnv().APP_URL;

  console.info(
    "\nDevelopment seed выполнен. Эти данные запрещено использовать в production:",
  );
  console.info(`  Email: ${DEMO_USER.email}`);
  console.info(`  Пароль: ${DEMO_USER.password}`);
  console.info(
    `  Редактор проекта: ${appUrl}/dashboard/projects/${project.id}/editor`,
  );
  console.info(`  Опубликованная страница: ${appUrl}/s/${project.slug}\n`);
}

main()
  .catch((error: unknown) => {
    console.error(`Seed завершился ошибкой: ${errorMessage(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
