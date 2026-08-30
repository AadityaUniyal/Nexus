import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  const routes = repository.getRoutes();
  return NextResponse.json({ success: true, data: routes }, { headers: rateLimit.headers });
}
