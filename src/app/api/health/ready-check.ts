import { db } from "@/lib/db";

import { healthResponse } from "./response";

export async function databaseReadinessResponse() {
  try {
    await db.$queryRaw<Array<{ ready: number }>>`SELECT 1 AS ready`;

    return healthResponse({ status: "ok", checks: { database: "ok" } });
  } catch {
    return healthResponse(
      { status: "unavailable", checks: { database: "unavailable" } },
      503,
    );
  }
}
