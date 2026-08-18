import {
  projectIdSchema,
  publishProjectInputSchema,
} from "@/features/projects/schemas";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { requireUser } from "@/server/auth";
import {
  projectApiErrorResponse,
  publishProjectForUser,
  readProjectJsonBody,
  unpublishProjectForUser,
} from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishRouteContext = {
  params: Promise<{ projectId: string }>;
};

async function resolveProjectId(
  context: PublishRouteContext,
): Promise<string | null> {
  const { projectId } = await context.params;
  const result = projectIdSchema.safeParse(projectId);
  return result.success ? result.data : null;
}

export async function POST(request: Request, context: PublishRouteContext) {
  try {
    const user = await requireUser(request.headers);
    const projectId = await resolveProjectId(context);
    if (!projectId) {
      return apiError(404, "NOT_FOUND", "Проект не найден.");
    }

    const input = publishProjectInputSchema.parse(
      await readProjectJsonBody(request),
    );
    return apiSuccess(
      await publishProjectForUser(user.id, projectId, input.revision),
    );
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: PublishRouteContext) {
  try {
    const user = await requireUser(request.headers);
    const projectId = await resolveProjectId(context);
    if (!projectId) {
      return apiError(404, "NOT_FOUND", "Проект не найден.");
    }

    return apiSuccess(await unpublishProjectForUser(user.id, projectId));
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}
