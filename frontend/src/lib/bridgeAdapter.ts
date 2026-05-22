import { encodeFunctionData, createPublicClient, http } from "viem";
import { baseSepolia, sepolia, optimismSepolia } from "viem/chains";

const APPROVE_ABI = [{
  name: "approve",
  type: "function" as const,
  inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
  outputs: [{ type: "bool" }],
}];

const BALANCE_OF_ABI = [{
  name: "balanceOf",
  type: "function" as const,
  stateMutability: "view" as const,
  inputs: [{ name: "account", type: "address" }],
  outputs: [{ type: "uint256" }],
}];

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  84532:    "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
};

const CHAIN_CLIENTS: Record<number, ReturnType<typeof createPublicClient>> = {
  84532:    createPublicClient({ chain: baseSepolia,     transport: http() }),
  11155111: createPublicClient({ chain: sepolia,         transport: http() }),
  11155420: createPublicClient({ chain: optimismSepolia, transport: http() }),
};

const MOCK_GAS = { gasLimit: 200000n, maxFeePerGas: 1000000000n };

// Shared across prepareAction calls within one bridge session
let lastBurnTxHash: string | null = null;
let lastMessage: string | null = null;
let lastAttestation: string | null = null;

export function getLastBurnTxHash() { return lastBurnTxHash; }

function mockRequest(executeFn: () => Promise<string>) {
  return {
    type: "evm" as const,
    estimate: async () => MOCK_GAS,
    execute: executeFn,
  };
}

export function createWagmiAdapter(
  address: string,
  sendTransactionAsync: (tx: {
    to: `0x${string}`;
    data?: `0x${string}`;
    value?: bigint;
  }) => Promise<`0x${string}`>,
  waitForTransactionReceipt: (args: { hash: `0x${string}` }) => Promise<unknown>
) {
  return {
    prepare: async (tx: { to: string; data?: string; value?: bigint }) => {
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}` | undefined,
        value: tx.value,
      });
      return { hash };
    },

    prepareAction: async (action: string, params: any, ctx: any) => {
      console.log(">>> prepareAction:", action);
      console.log("prepareAction called:", action, typeof params);
      console.log("prepareAction:", action, JSON.stringify(params, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));

      // usdc.increaseAllowance — exact action name match
      if (action === "usdc.increaseAllowance") {
        const CCTP_V2_TOKEN_MESSENGER = "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa" as `0x${string}`;
        const usdcAddress = (params.chain?.usdcAddress ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;
        const spender = CCTP_V2_TOKEN_MESSENGER;
        const amount = BigInt(params.amount ?? "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const data = encodeFunctionData({
          abi: [{ name: "approve", type: "function" as const, inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }] }],
          functionName: "approve",
          args: [spender, amount],
        });
        console.log("increaseAllowance: to", usdcAddress, "spender", spender, "amount", amount.toString());
        return {
          type: "evm" as const,
          estimate: async () => ({ gasLimit: 100000n, maxFeePerGas: 1000000000n }),
          execute: async () => {
            const chainId = (params.chain as any)?.chainId as number;
            if (chainId && typeof window !== "undefined" && (window as any).ethereum) {
              try {
                await (window as any).ethereum.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: `0x${chainId.toString(16)}` }],
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (e) {
                console.error("Failed to switch chain:", e);
              }
            }
            const hash = await sendTransactionAsync({ to: usdcAddress, data });
            console.log("increaseAllowance tx hash:", hash);
            const sourceClient = CHAIN_CLIENTS[chainId] ?? CHAIN_CLIENTS[84532];
            console.log("waiting for receipt on chainId", chainId);
            await sourceClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
            console.log("increaseAllowance receipt confirmed");
            return hash;
          },
        };
      }

      // cctp.v2.customBurn — send via eth_sendTransaction
      if (action === "cctp.v2.customBurn") {
        return {
          type: "evm" as const,
          estimate: async () => ({ gasLimit: 200000n, maxFeePerGas: 1000000000n }),
          execute: async () => {
            console.log("cctp.v2.customBurn action:", JSON.stringify(action, null, 2));
            console.log("cctp.v2.customBurn params:", JSON.stringify(params, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));

            const data = encodeFunctionData({
              abi: [{
                name: "depositForBurn",
                type: "function" as const,
                inputs: [
                  { name: "amount",               type: "uint256" },
                  { name: "destinationDomain",    type: "uint32"  },
                  { name: "mintRecipient",        type: "bytes32" },
                  { name: "burnToken",            type: "address" },
                  { name: "destinationCaller",    type: "bytes32" },
                  { name: "maxFee",               type: "uint256" },
                  { name: "minFinalityThreshold", type: "uint32"  },
                ],
                outputs: [{ name: "nonce", type: "uint64" }],
                stateMutability: "nonpayable" as const,
              }],
              functionName: "depositForBurn",
              args: [
                BigInt(params.amount),
                26,
                params.mintRecipient as `0x${string}`,
                "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                BigInt(params.maxFee),
                params.minFinalityThreshold,
              ],
            });

            await (window as any).ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x14A34" }],
            });
            await new Promise(r => setTimeout(r, 1000));

            const txHash = await (window as any).ethereum.request({
              method: "eth_sendTransaction",
              params: [{
                from: "0xB4D0D085563695872a5DC2f7d2dC0DC9daf1C199",
                to: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
                data,
                value: "0x0",
                gas: "0x30D40",
              }],
            });
            console.log("burn tx hash:", txHash);
            lastBurnTxHash = txHash;
            return txHash;
          },
        };
      }

      // fetchAttestation — poll Circle V2 API and store message + attestation
      if (action === "fetchAttestation" || action.endsWith(".fetchAttestation")) {
        console.log("[BridgeAdapter] fetchAttestation intercepted, burn tx:", lastBurnTxHash);
        return {
          type: "evm" as const,
          estimate: async () => ({ gasLimit: 100000n, maxFeePerGas: 1000000000n }),
          execute: async () => {
            try {
              const burnTxHash = lastBurnTxHash ?? params.transactionHash ?? params.txHash;
              if (!burnTxHash) throw new Error("fetchAttestation: no burn tx hash available");

              for (let i = 0; i < 72; i++) {
                console.log(`[BridgeAdapter] fetchAttestation poll attempt ${i + 1}/72...`);
                const resp = await fetch(
                  `https://iris-api-sandbox.circle.com/v2/messages/6?transactionHash=${burnTxHash}`
                );
                const data = await resp.json();
                const msg = data.messages?.[0];
                console.log("[BridgeAdapter] fetchAttestation status:", msg?.status);
                if (msg?.status === "complete") {
                  lastMessage = msg.message;
                  lastAttestation = msg.attestation;
                  console.log("[BridgeAdapter] fetchAttestation complete, message length:", msg.message?.length);
                  return JSON.stringify({ message: msg.message, attestation: msg.attestation });
                }
                await new Promise(r => setTimeout(r, 5000));
              }
              throw new Error("fetchAttestation: timed out waiting for attestation");
            } catch (err) {
              console.error("[BridgeAdapter] fetchAttestation ERROR:", err);
              throw err;
            }
          },
        };
      }

      // mint — relay receiveMessage via server-side relayer
      if (action === "mint" || action.endsWith(".mint")) {
        console.log("[BridgeAdapter] MINT INTERCEPTED - action:", action);
        console.log("[BridgeAdapter] MINT params keys:", Object.keys(params || {}));
        console.log("[BridgeAdapter] MINT params:", JSON.stringify(params, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
        console.log("[BridgeAdapter] mint params.message:", params.message);
        console.log("[BridgeAdapter] mint params.attestation:", params.attestation);
        console.log("[BridgeAdapter] lastBurnTxHash:", lastBurnTxHash);
        return {
          type: "evm" as const,
          estimate: async () => ({ gasLimit: 300000n, maxFeePerGas: 1000000000n }),
          execute: async () => {
            try {
              // If Bridge Kit already resolved message + attestation, use them directly
              // Fall back to values stored by fetchAttestation interceptor
              let message: string | null = params.message ?? params.messageBytes ?? lastMessage ?? null;
              let attestation: string | null = params.attestation ?? lastAttestation ?? null;

              // Otherwise poll Circle V2 API using the burn tx hash
              if (!message || !attestation) {
                const burnTxHash = params.transactionHash ?? params.burnTxHash ?? params.txHash ?? lastBurnTxHash;
                if (!burnTxHash) throw new Error("mint: no burn tx hash available");
                console.log("[BridgeAdapter] polling Circle V2 attestation for burn tx:", burnTxHash);

                for (let i = 0; i < 72; i++) {
                  console.log(`[BridgeAdapter] attestation poll attempt ${i + 1}/72...`);
                  const resp = await fetch(
                    `https://iris-api-sandbox.circle.com/v2/messages/6?transactionHash=${burnTxHash}`
                  );
                  const data = await resp.json();
                  const msg = data.messages?.[0];
                  console.log("[BridgeAdapter] attestation status:", msg?.status);
                  if (msg?.status === "complete") {
                    message = msg.message;
                    attestation = msg.attestation;
                    break;
                  }
                  await new Promise(r => setTimeout(r, 5000));
                }
              }

              if (!message || !attestation) throw new Error("mint: attestation timed out");

              console.log("[BridgeAdapter] calling relay-mint with message length:", message.length);
              const resp = await fetch("/api/relay-mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, attestation }),
              });
              const result = await resp.json();
              if (!resp.ok) throw new Error(`relay-mint failed: ${result.error}`);
              console.log("[BridgeAdapter] relay-mint tx hash:", result.txHash);
              return result.txHash;
            } catch (err) {
              console.error("[BridgeAdapter] MINT INTERCEPTOR ERROR:", err);
              throw err;
            }
          },
        };
      }

      // Read-only balance / allowance
      if (action.includes("balanceOf") || action.includes("allowance") || action.includes("read")) {
        return mockRequest(async () => {
          try {
            const chainId: number = ctx?.chain?.id ?? ctx?.chainId ?? 84532;
            const client = CHAIN_CLIENTS[chainId] ?? CHAIN_CLIENTS[84532];
            const tokenAddress = (params.tokenAddress ?? params.token ?? params.asset ?? USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[84532]) as `0x${string}`;
            const account = (params.account ?? params.owner ?? address) as `0x${string}`;
            const balance = await client.readContract({
              address: tokenAddress,
              abi: BALANCE_OF_ABI,
              functionName: "balanceOf",
              args: [account],
            });
            return "0x" + BigInt(balance as bigint ?? 0n).toString(16).padStart(64, "0");
          } catch (e) {
            console.error("balanceOf read failed:", e);
            return "0x0000000000000000000000000000000000000000000000000000000000000000";
          }
        });
      }

      // ERC-20 approve
      if (action.includes("approve")) {
        console.log("prepareAction approve params:", JSON.stringify(params, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
        console.log("prepareAction approve ctx keys:", ctx ? Object.keys(ctx) : "no ctx");
        const tokenAddress = (params.tokenAddress ?? params.token ?? params.asset ?? ctx?.contractAddress) as `0x${string}`;
        const spender = (params.delegate ?? params.spender ?? params.to) as `0x${string}`;
        const amount = BigInt(params.amount ?? params.value ?? "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const data = encodeFunctionData({ abi: APPROVE_ABI, functionName: "approve", args: [spender, amount] });
        return mockRequest(async () => {
          try {
            console.log("executing approve tx:", { to: tokenAddress, data });
            const hash = await sendTransactionAsync({ to: tokenAddress, data });
            console.log("approve tx hash:", hash);
            return hash;
          } catch (e) {
            console.error("approve execute failed:", e);
            throw e;
          }
        });
      }

      // CCTP burn / deposit
      if (action.includes("burn") || action.includes("deposit") || action.includes("cctp")) {
        const to = (params.to ?? params.contractAddress ?? ctx?.contractAddress) as `0x${string}`;
        const data = params.data as `0x${string}` | undefined;
        const value = params.value !== undefined ? BigInt(params.value) : undefined;
        return mockRequest(async () => sendTransactionAsync({ to, data, value }));
      }

      // Raw tx fallback
      if (params?.data) {
        const to = (params.to ?? params.contractAddress ?? ctx?.contractAddress) as `0x${string}`;
        const data = params.data as `0x${string}`;
        const value = params.value !== undefined ? BigInt(params.value) : undefined;
        return mockRequest(async () => sendTransactionAsync({ to, data, value }));
      }

      // Unknown — noop
      console.log("prepareAction UNHANDLED:", action, JSON.stringify(params, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
      return mockRequest(async () => "0x0000000000000000000000000000000000000000000000000000000000000000");
    },

    waitForTransaction: async (hash: `0x${string}`) => {
      console.log("waitForTransaction called for hash:", hash);
      const clients = Object.values(CHAIN_CLIENTS);
      const receipt = await Promise.any(
        clients.map(client => client.waitForTransactionReceipt({ hash }))
      );
      console.log("waitForTransaction receipt found:", receipt.transactionHash);
      return receipt;
    },

    getAddress: () => address,

    validateChainSupport: async (chain: unknown) => {
      return true;
    },

    capabilities: {
      signTypedData: false,
      sendTransaction: true,
    },

    signAndSendTransaction: async (tx: any) => {
      console.log("signAndSendTransaction called with:", JSON.stringify(tx, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
      try {
        const hash = await sendTransactionAsync({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}` | undefined,
          value: tx.value ? BigInt(tx.value) : undefined,
        });
        console.log("signAndSendTransaction hash:", hash);
        return hash;
      } catch (e) {
        console.error("signAndSendTransaction failed:", e);
        throw e;
      }
    },
  };
}
