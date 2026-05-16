import { GatewayClient } from "@circle-fin/x402-batching/client";

let _client: GatewayClient | null = null;

export function getGatewayClient(): GatewayClient {
  if (_client) return _client;

  const privateKey = process.env.NEXT_PUBLIC_GATEWAY_PRIVATE_KEY;
  if (!privateKey) throw new Error("NEXT_PUBLIC_GATEWAY_PRIVATE_KEY is not set");

  _client = new GatewayClient({
    chain: "arcTestnet",
    privateKey: privateKey as `0x${string}`,
  });

  return _client;
}
