import {
  projectIdSchema,
  updateProjectInputSchema,
} from "@/features/projects/schemas";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { requireUser } from "@/server/auth";
import {
  deleteProjectForUser,
  getProjectForUser,
  projectApiErrorResponse,
  readProjectJsonBody,
  updateProjectDraftForUser,
} from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectRouteContext = {
  params: Promise<{ projectId: string }>;
};

async function resolveProjectId(
  context: ProjectRouteContext,
): Promise<string | null> {
  const { projectId } = await context.params;
  const result = projectIdSchema.safeParse(projectId);
  return result.success ? result.data : null;
}

export async function GET(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireUser(request.headers);
    const projectId = await resolveProjectId(context);
    if (!projectId) {
      return apiError(404, "NOT_FOUND", "Проект не найден.");
    }

    return apiSuccess(await getProjectForUser(user.id, projectId));
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireUser(request.headers);
    const projectId = await resolveProjectId(context);
    if (!projectId) {
      return apiError(404, "NOT_FOUND", "Проект не найден.");
    }

    const input = updateProjectInputSchema.parse(
      await readProjectJsonBody(request),
    );
    return apiSuccess(
      await updateProjectDraftForUser(
        user.id,
        projectId,
        input.schema,
        input.revision,
      ),
    );
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireUser(request.headers);
    const projectId = await resolveProjectId(context);
    if (!projectId) {
      return apiError(404, "NOT_FOUND", "Проект не найден.");
    }

    return apiSuccess(await deleteProjectForUser(user.id, projectId));
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}
