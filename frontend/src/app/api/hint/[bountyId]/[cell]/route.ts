import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { bountyId: string; cell: string } }
) {
  const cellIdx = parseInt(params.cell, 10);
  if (isNaN(cellIdx) || cellIdx < 0 || cellIdx > 80)
    return NextResponse.json({ error: "cell must be 0-80" }, { status: 400 });

  const txHash = req.nextUrl.searchParams.get("txHash");

  if (!txHash)
    return NextResponse.json({ error: "Payment required", price: "0.001 USDC" }, { status: 402 });

  try {
    const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });

    const sellerAddress = process.env.CIRCLE_SELLER_ADDRESS!;
    const valid =
      tx.to?.toLowerCase() === sellerAddress.toLowerCase() &&
      tx.value >= 1000n &&
      tx.blockNumber !== null;

    if (!valid)
      return NextResponse.json({ error: "Invalid or unconfirmed payment" }, { status: 402 });
  } catch {
    return NextResponse.json({ error: "Invalid or unconfirmed payment" }, { status: 402 });
  }

  const raw = await kv.get<string>(`solution:${params.bountyId}`);
  if (!raw) return NextResponse.json({ error: "No solution stored for this bounty" }, { status: 404 });

  const solution: number[] = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json({ value: solution[cellIdx] });
}
