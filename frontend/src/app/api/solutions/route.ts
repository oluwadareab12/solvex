import { NextRequest, NextResponse } from "next/server";

// Shared in-memory store — persists per server process (testnet only)
export const solutions = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  const body = await req.json() as { bountyId: string; solution: number[] };
  const { bountyId, solution } = body;

  if (!bountyId || !Array.isArray(solution) || solution.length !== 81) {
    return NextResponse.json(
      { error: "bountyId (string) and solution (81-element number[]) required" },
      { status: 400 }
    );
  }

  solutions.set(String(bountyId), solution);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const bountyId = req.nextUrl.searchParams.get("bountyId");
  if (!bountyId)
    return NextResponse.json({ error: "Missing bountyId" }, { status: 400 });

  const solution = solutions.get(bountyId);
  if (!solution)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ solution });
}
