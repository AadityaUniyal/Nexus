import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  const users = repository.getUsers();
  return NextResponse.json({ success: true, data: users }, { headers: rateLimit.headers });
}

export async function POST(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await req.json();
    const newUser = repository.createUser(body);
    return NextResponse.json({ success: true, data: newUser }, { headers: rateLimit.headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
