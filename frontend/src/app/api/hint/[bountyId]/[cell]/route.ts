import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";
import { Redis } from "@upstash/redis";
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import {
  CIRCLE_BATCHING_NAME,
  CIRCLE_BATCHING_SCHEME,
  CIRCLE_BATCHING_VERSION,
  GATEWAY_AUTH_VALIDITY_WINDOW_SECONDS,
} from "@circle-fin/x402-batching";

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

// Arc Testnet x402 / gateway constants
const ARC_NETWORK       = "eip155:5042002";
const ARC_USDC_ADDRESS  = "0x3600000000000000000000000000000000000000";
const GATEWAY_VERIFYING = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
const HINT_AMOUNT       = "1000"; // 1000 micro-USDC = $0.001

const facilitator = new BatchFacilitatorClient();

function buildPaymentRequirements(sellerAddress: string) {
  return {
    scheme:            CIRCLE_BATCHING_SCHEME,
    network:           ARC_NETWORK,
    asset:             ARC_USDC_ADDRESS,
    amount:            HINT_AMOUNT,
    payTo:             sellerAddress,
    maxTimeoutSeconds: GATEWAY_AUTH_VALIDITY_WINDOW_SECONDS,
    extra: {
      name:              CIRCLE_BATCHING_NAME,
      version:           CIRCLE_BATCHING_VERSION,
      verifyingContract: GATEWAY_VERIFYING,
    },
  };
}

async function resolveHint(bountyId: string, cellIdx: number): Promise<number | null> {
  const raw = await kv.get<string>(`solution:${bountyId}`);
  if (!raw) return null;
  const solution: number[] = typeof raw === "string" ? JSON.parse(raw) : raw;
  return solution[cellIdx];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { bountyId: string; cell: string } }
) {
  const cellIdx = parseInt(params.cell, 10);
  if (isNaN(cellIdx) || cellIdx < 0 || cellIdx > 80)
    return NextResponse.json({ error: "cell must be 0-80" }, { status: 400 });

  const sellerAddress = process.env.CIRCLE_SELLER_ADDRESS!;

  // ── Path A: x402 Gateway payment ────────────────────────────────────────────
  const paymentHeader = req.headers.get("payment-signature");
  if (paymentHeader) {
    let paymentPayload: Record<string, unknown>;
    try {
      paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
    } catch {
      return NextResponse.json({ error: "Malformed payment-signature header" }, { status: 400 });
    }

    const requirements = buildPaymentRequirements(sellerAddress);

    const verifyResult = await facilitator.verify(paymentPayload, requirements);
    if (!verifyResult.isValid) {
      return NextResponse.json(
        { error: "Payment verification failed", reason: verifyResult.invalidReason },
        { status: 402 }
      );
    }

    // Settle asynchronously — don't block the response
    facilitator.settle(paymentPayload, requirements).catch(console.error);

    const value = await resolveHint(params.bountyId, cellIdx);
    if (value === null)
      return NextResponse.json({ error: "No solution stored for this bounty" }, { status: 404 });

    return NextResponse.json({ value });
  }

  // ── Path B: on-chain txHash payment ─────────────────────────────────────────
  const txHash = req.nextUrl.searchParams.get("txHash");
  if (txHash) {
    try {
      const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
      const valid =
        tx.to?.toLowerCase() === sellerAddress.toLowerCase() &&
        tx.value >= 1000n &&
        tx.blockNumber !== null;

      if (!valid)
        return NextResponse.json({ error: "Invalid or unconfirmed payment" }, { status: 402 });
    } catch {
      return NextResponse.json({ error: "Invalid or unconfirmed payment" }, { status: 402 });
    }

    const value = await resolveHint(params.bountyId, cellIdx);
    if (value === null)
      return NextResponse.json({ error: "No solution stored for this bounty" }, { status: 404 });

    return NextResponse.json({ value });
  }

  // ── Path C: no payment — return 402 with requirements ───────────────────────
  const resourceUrl = req.nextUrl.href;
  const paymentRequired = {
    x402Version: 2,
    resource:    { url: resourceUrl, description: "Sudoku hint", mimeType: "application/json" },
    accepts:     [buildPaymentRequirements(sellerAddress)],
  };
  const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString("base64");

  return new Response(JSON.stringify({ error: "Payment required", price: "0.001 USDC" }), {
    status: 402,
    headers: {
      "Content-Type":     "application/json",
      "PAYMENT-REQUIRED": encoded,
    },
  });
}
