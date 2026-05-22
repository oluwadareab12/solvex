import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ARC_RPC = "https://rpc.testnet.arc.network/";
const ARC_MESSAGE_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;

const RECEIVE_ABI = [{
  name: "receiveMessage",
  type: "function" as const,
  inputs: [
    { name: "message",     type: "bytes" },
    { name: "attestation", type: "bytes" },
  ],
  outputs: [],
  stateMutability: "nonpayable" as const,
}];

export async function POST(req: NextRequest) {
  const { message, attestation } = await req.json();
  if (!message || !attestation) {
    return NextResponse.json({ error: "message and attestation required" }, { status: 400 });
  }

  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json({ error: "RELAYER_PRIVATE_KEY not set" }, { status: 500 });
  }

  try {
    const account = privateKeyToAccount(pk as `0x${string}`);
    const wallet = createWalletClient({ account, transport: http(ARC_RPC) });

    const calldata = encodeFunctionData({
      abi: RECEIVE_ABI,
      functionName: "receiveMessage",
      args: [message as `0x${string}`, attestation as `0x${string}`],
    });

    const txHash = await wallet.sendTransaction({
      to: ARC_MESSAGE_TRANSMITTER,
      data: calldata,
      gas: 300000n,
    });

    console.log("relay-mint receiveMessage tx:", txHash);
    return NextResponse.json({ txHash });
  } catch (e) {
    console.error("relay-mint failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
