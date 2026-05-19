import { NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { GatewayClient } from "@circle-fin/x402-batching/client";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  testnet: true,
});

const BOUNTY_MARKET = (process.env.NEXT_PUBLIC_BOUNTY_MARKET ?? "0x0") as `0x${string}`;

const BOUNTY_MARKET_ABI = [
  { name: "nextBountyId", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "getBounty", type: "function", stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{
      type: "tuple", components: [
        { name: "puzzleHash", type: "bytes32" },
        { name: "pool",       type: "uint256" },
        { name: "creator",    type: "address" },
        { name: "deadline",   type: "uint256" },
        { name: "claimed",    type: "bool" },
        { name: "solver",     type: "address" },
        { name: "difficulty", type: "uint8" },
        { name: "title",      type: "string" },
      ],
    }],
  },
  {
    name: "getPuzzle", type: "function", stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "uint8[81]" }],
  },
  {
    name: "claim", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "id",         type: "uint256" },
      { name: "pA",         type: "uint256[2]" },
      { name: "pB",         type: "uint256[2][2]" },
      { name: "pC",         type: "uint256[2]" },
      { name: "pubSignals", type: "uint256[81]" },
    ],
    outputs: [],
  },
] as const;

// Sudoku helpers — inlined to avoid "use client" import restrictions

function getCandidates(grid: number[], idx: number): number[] {
  const row = Math.floor(idx / 9);
  const col = idx % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const used = new Set<number>();

  for (let c = 0; c < 9; c++) used.add(grid[row * 9 + c]);
  for (let r = 0; r < 9; r++) used.add(grid[r * 9 + col]);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      used.add(grid[(boxRow + r) * 9 + boxCol + c]);

  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));
}

function nakedSinglesPass(grid: number[]): boolean {
  let changed = false;
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const cands = getCandidates(grid, i);
    if (cands.length === 1) { grid[i] = cands[0]; changed = true; }
  }
  return changed;
}

function isValidSudoku(grid: number[]): boolean {
  if (grid.length !== 81) return false;
  const check = (cells: number[]) => {
    const s = new Set(cells);
    return s.size === 9 && !s.has(0) && Math.min(...cells) >= 1 && Math.max(...cells) <= 9;
  };
  for (let i = 0; i < 9; i++) {
    const row = grid.slice(i * 9, i * 9 + 9);
    const col = Array.from({ length: 9 }, (_, r) => grid[r * 9 + i]);
    const br = Math.floor(i / 3) * 3;
    const bc = (i % 3) * 3;
    const box = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => grid[(br + r) * 9 + bc + c]));
    if (!check(row) || !check(col) || !check(box)) return false;
  }
  return true;
}

export async function POST() {
  const rawKey = process.env.AGENT_WALLET_PRIVATE_KEY ?? "";
  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
  if (!rawKey) return NextResponse.json({ error: "AGENT_WALLET_PRIVATE_KEY not set" }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type: "log" | "error" | "success", message: string, data?: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify({ type, message, data }) + "\n"));
      };

      try {
        const publicClient = createPublicClient({ chain: arcTestnet, transport: http("https://rpc.testnet.arc.network") });
        const account = privateKeyToAccount(privateKey);

        emit("log", `Agent wallet: ${account.address}`);

        // Step 1 — enumerate bounties
        emit("log", "Reading bounties from contract…");
        const total = await publicClient.readContract({
          address: BOUNTY_MARKET,
          abi: BOUNTY_MARKET_ABI,
          functionName: "nextBountyId",
        }) as bigint;
        emit("log", `Total bounties on-chain: ${total}`);

        // Step 2 — pick first open bounty
        const now = BigInt(Math.floor(Date.now() / 1000));
        type Bounty = { puzzleHash: `0x${string}`; pool: bigint; creator: `0x${string}`; deadline: bigint; claimed: boolean; solver: `0x${string}`; difficulty: number; title: string };
        let target: (Bounty & { id: bigint }) | null = null;

        for (let i = 0; i < Number(total); i++) {
          const b = await publicClient.readContract({
            address: BOUNTY_MARKET,
            abi: BOUNTY_MARKET_ABI,
            functionName: "getBounty",
            args: [BigInt(i)],
          }) as Bounty;
          if (!b.claimed && b.deadline > now) {
            target = { ...b, id: BigInt(i) };
            break;
          }
        }

        if (!target) { emit("error", "No open, non-expired bounties found."); controller.close(); return; }
        emit("log", `Selected bounty #${target.id}: "${target.title}" — pool ${target.pool} wei`);

        // Step 3 — fetch puzzle from chain
        const rawPuzzle = await publicClient.readContract({
          address: BOUNTY_MARKET,
          abi: BOUNTY_MARKET_ABI,
          functionName: "getPuzzle",
          args: [target.id],
        }) as readonly number[];
        const puzzle = Array.from(rawPuzzle).map(Number);
        const clueCount = puzzle.filter((v) => v !== 0).length;
        emit("log", `Puzzle loaded — ${clueCount} clues given`);

        // Step 4 — solve: naked singles first, then buy hints for remaining cells
        const gc = new GatewayClient({ chain: "arcTestnet", privateKey });
        const grid = [...puzzle];

        let progress = true;
        while (progress) progress = nakedSinglesPass(grid);

        const blanks = grid.reduce((acc, v, i) => (puzzle[i] === 0 && v === 0 ? [...acc, i] : acc), [] as number[]);
        emit("log", `Logic solved ${clueCount + (81 - clueCount - blanks.length)} / 81 cells — buying ${blanks.length} hint(s) via x402…`);

        for (const cellIdx of blanks) {
          const hintUrl = `${appUrl}/api/hint/${target.id}/${cellIdx}`;
          emit("log", `Paying for hint: cell ${cellIdx} (${hintUrl})`);
          const result = await gc.pay<{ value: number }>(hintUrl);
          grid[cellIdx] = result.data.value;
          emit("log", `  → cell ${cellIdx} = ${grid[cellIdx]}`);
        }

        // Step 5 — validate
        if (!isValidSudoku(grid)) { emit("error", "Solution failed validation — grid is not a correct Sudoku."); controller.close(); return; }
        emit("success", "Solution validated ✓");

        emit("log", "ZK proof generation delegated to human operator (computationally intensive — ~5min in serverless)");
        emit("success", `Solution complete ✓ — visit /solve/${target.id} to generate proof and claim the bounty`);

      } catch (e) {
        emit("error", e instanceof Error ? e.message : String(e));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
