import { NextRequest, NextResponse } from "next/server";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { solutions } from "@/app/api/solutions/route";

const gateway = createGatewayMiddleware({
  sellerAddress: process.env.CIRCLE_SELLER_ADDRESS!,
  networks: ["eip155:5042002"],
});

// $0.001 USDC — Arc Testnet uses USDC as native token (6 decimals: 0.001 × 10^6 = 1000)
const PRICE = "1000";

function paymentRequired(url: string, cellIdx: number, bountyId: string) {
  return NextResponse.json(
    {
      x402Version: 1,
      error: "Payment Required",
      accepts: [
        {
          scheme:             "exact",
          network:            "eip155:5042002",
          maxAmountRequired:  PRICE,
          resource:           url,
          description:        `Hint for cell ${cellIdx} — bounty #${bountyId}`,
          mimeType:           "application/json",
          payTo:              process.env.CIRCLE_SELLER_ADDRESS,
          maxTimeoutSeconds:  300,
          asset:              "native",
          extra:              { name: "USDC", version: "2" },
        },
      ],
    },
    {
      status: 402,
      headers: { "WWW-Authenticate": "X-PAYMENT" },
    }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { bountyId: string; cell: string } }
) {
  const cellIdx = parseInt(params.cell, 10);
  if (isNaN(cellIdx) || cellIdx < 0 || cellIdx > 80)
    return NextResponse.json({ error: "cell must be 0–80" }, { status: 400 });

  const xPayment = req.headers.get("x-payment");

  if (!xPayment) return paymentRequired(req.url, cellIdx, params.bountyId);

  const result = await gateway.verify(xPayment);
  if (!result.valid)
    return NextResponse.json(
      { error: result.error ?? "Payment verification failed" },
      { status: 402 }
    );

  const solution = solutions.get(params.bountyId);
  if (!solution)
    return NextResponse.json(
      { error: "No solution stored for this bounty" },
      { status: 404 }
    );

  const value = solution[cellIdx];
  if (!value)
    return NextResponse.json({ error: "Cell is empty in solution" }, { status: 400 });

  return NextResponse.json({ value });
}
