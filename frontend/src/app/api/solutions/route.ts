import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { bountyId, solution } = await req.json() as { bountyId: string; solution: number[] };
  if (!bountyId || !Array.isArray(solution) || solution.length !== 81)
    return NextResponse.json({ error: "bountyId + 81-element solution required" }, { status: 400 });

  await kv.set(`solution:${bountyId}`, JSON.stringify(solution));
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const bountyId = req.nextUrl.searchParams.get("bountyId");
  if (!bountyId) return NextResponse.json({ error: "Missing bountyId" }, { status: 400 });

  const raw = await kv.get<string>(`solution:${bountyId}`);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const solution = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json({ solution });
}
