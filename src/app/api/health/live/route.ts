import { healthResponse } from "../response";

export const dynamic = "force-dynamic";

export async function GET() {
  return healthResponse({ status: "ok" });
}
