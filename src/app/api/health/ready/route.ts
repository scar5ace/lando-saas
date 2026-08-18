import { databaseReadinessResponse } from "../ready-check";

export const dynamic = "force-dynamic";

export async function GET() {
  return databaseReadinessResponse();
}
