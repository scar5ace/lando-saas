import { apiSuccess } from "@/lib/http/responses";
import { createProjectInputSchema } from "@/features/projects/schemas";
import { requireUser } from "@/server/auth";
import {
  createProjectForUser,
  enforceProjectGenerationRateLimit,
  listProjectsForUser,
  projectApiErrorResponse,
  readProjectJsonBody,
} from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request.headers);
    return apiSuccess(await listProjectsForUser(user.id));
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request.headers);
    const input = createProjectInputSchema.parse(
      await readProjectJsonBody(request),
    );
    enforceProjectGenerationRateLimit(user.id);

    const result = await createProjectForUser(user.id, input.prompt);
    return apiSuccess(result, { status: 201 });
  } catch (error) {
    return projectApiErrorResponse(error);
  }
}
