import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(req: NextRequest) {
  const bountyId = req.nextUrl.searchParams.get("bountyId");
  if (!bountyId)
    return NextResponse.json({ error: "bountyId required" }, { status: 400 });

  const raw = await kv.get<string>(`agent-solution:${bountyId}`);
  if (!raw)
    return NextResponse.json({ error: "No agent solution found" }, { status: 404 });

  const solution: number[] = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json({ solution });
}
