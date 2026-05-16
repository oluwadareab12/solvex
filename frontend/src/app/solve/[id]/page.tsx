"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { SudokuGrid } from "@/components/SudokuGrid";
import { generateProof, validateSudoku } from "@/lib/proof";
import { BOUNTY_MARKET_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { getGatewayClient } from "@/lib/gatewayClient";
import type { BountyData } from "@/lib/types";

const DIFF_LABEL = ["", "Easy", "Medium", "Hard"];
const DIFF_COLOR = ["", "text-teal-400", "text-amber-400", "text-red-400"];

type Stage = "idle" | "proving" | "submitting" | "done" | "error";

export default function SolvePage() {
  const { id }          = useParams<{ id: string }>();
  const { isConnected } = useAccount();
  const client          = usePublicClient();

  const [bounty,    setBounty]    = useState<BountyData | null>(null);
  const [puzzle,    setPuzzle]    = useState<number[]>(Array(81).fill(0));
  const [solution,  setSolution]  = useState<number[]>(Array(81).fill(0));
  const [conflicts, setConflicts] = useState<Set<number>>(new Set());
  const [stage,     setStage]     = useState<Stage>("idle");
  const [errMsg,    setErrMsg]    = useState("");
  const [bountyAmount, setBountyAmount] = useState("");

  // Hint state
  const [hints,        setHints]        = useState<Record<number, number>>({});
  const [hintLoading,  setHintLoading]  = useState<Set<number>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<number>>(new Set());

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Load bounty + puzzle from chain
  useEffect(() => {
    if (!client || !id) return;
    const load = async () => {
      const [b, p] = await Promise.all([
        client.readContract({
          address: CONTRACT_ADDRESSES.bountyMarket,
          abi: BOUNTY_MARKET_ABI,
          functionName: "getBounty",
          args: [BigInt(id)],
        }),
        client.readContract({
          address: CONTRACT_ADDRESSES.bountyMarket,
          abi: BOUNTY_MARKET_ABI,
          functionName: "getPuzzle",
          args: [BigInt(id)],
        }),
      ]) as [BountyData, readonly number[]];

      setBounty({ ...b, id: BigInt(id) });
      const pArr = Array.from(p);
      setPuzzle(pArr);
      setSolution([...pArr]);
    };
    load().catch(console.error);
  }, [client, id]);

  const handleCell = useCallback((idx: number, val: number) => {
    setSolution((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  // Live conflict detection
  useEffect(() => {
    const c = new Set<number>();
    const check = (indices: number[]) => {
      const seen = new Map<number, number[]>();
      indices.forEach((i) => {
        const v = solution[i];
        if (v === 0) return;
        if (!seen.has(v)) seen.set(v, []);
        seen.get(v)!.push(i);
      });
      seen.forEach((idxs) => { if (idxs.length > 1) idxs.forEach((i) => c.add(i)); });
    };
    for (let r = 0; r < 9; r++) check(Array.from({ length: 9 }, (_, c) => r * 9 + c));
    for (let col = 0; col < 9; col++) check(Array.from({ length: 9 }, (_, r) => r * 9 + col));
    for (let b = 0; b < 9; b++) {
      const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
      check([0,1,2].flatMap((r) => [0,1,2].map((c) => (br+r)*9 + (bc+c))));
    }
    setConflicts(c);
  }, [solution]);

  // Buy a hint for one cell
  async function buyHint(cellIdx: number) {
    setHintLoading((prev) => new Set(prev).add(cellIdx));
    setErrMsg("");
    try {
      const gc = getGatewayClient();
      const result = await gc.pay<{ value: number }>(`/api/hint/${id}/${cellIdx}`);
      const val = result.data.value;

      // Fill the cell
      handleCell(cellIdx, val);
      setHints((prev) => ({ ...prev, [cellIdx]: val }));

      // Flash indigo for 2 s
      setRevealedCells((prev) => new Set(prev).add(cellIdx));
      setTimeout(() => {
        setRevealedCells((prev) => {
          const next = new Set(prev);
          next.delete(cellIdx);
          return next;
        });
      }, 2000);
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Hint purchase failed");
    } finally {
      setHintLoading((prev) => {
        const next = new Set(prev);
        next.delete(cellIdx);
        return next;
      });
    }
  }

  async function handleProveAndClaim() {
    if (!isConnected) { setErrMsg("Connect wallet first"); return; }
    if (!validateSudoku(solution)) { setErrMsg("Solution is not a valid completed Sudoku"); return; }
    if (conflicts.size > 0) { setErrMsg("Fix conflicts before proving"); return; }

    setStage("proving");
    setErrMsg("");

    try {
      const calldata = await generateProof(puzzle, solution);
      setStage("submitting");
      writeContract({
        address:      CONTRACT_ADDRESSES.bountyMarket,
        abi:          BOUNTY_MARKET_ABI,
        functionName: "claim",
        args: [
          BigInt(id),
          calldata.pA as [bigint, bigint],
          calldata.pB as [[bigint, bigint],[bigint, bigint]],
          calldata.pC as [bigint, bigint],
          calldata.pubSignals as unknown as readonly bigint[],
        ],
      });
    } catch (e: unknown) {
      setStage("error");
      setErrMsg(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function handleContribute() {
    if (!isConnected || !bountyAmount) return;
    writeContract({
      address:      CONTRACT_ADDRESSES.bountyMarket,
      abi:          BOUNTY_MARKET_ABI,
      functionName: "contribute",
      args:         [BigInt(id)],
      value:        BigInt(Math.floor(parseFloat(bountyAmount) * 1e18)),
    });
  }

  if (isSuccess && stage !== "done") setStage("done");

  const filled   = solution.filter((v, i) => puzzle[i] === 0 && v !== 0).length;
  const blanks   = puzzle.filter((v) => v === 0).length;
  const complete = filled === blanks && blanks > 0;

  // Empty cells that haven't been filled or hinted yet
  const hintableCells = puzzle
    .map((v, i) => ({ i, isBlank: v === 0, unfilled: solution[i] === 0 }))
    .filter((c) => c.isBlank && c.unfilled);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      {bounty && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{bounty.title}</h1>
              <span className={`text-sm font-semibold ${DIFF_COLOR[bounty.difficulty]}`}>
                {DIFF_LABEL[bounty.difficulty]}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Bounty #{id} · {bounty.claimed ? "Solved" : "Open"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold">
              {parseFloat(formatEther(bounty.pool)).toFixed(3)}
              <span className="text-slate-400 text-base font-normal ml-1">ETH</span>
            </div>
            <div className="text-xs text-slate-500">prize pool</div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Grid */}
        <div className="flex flex-col items-center gap-4">
          <SudokuGrid
            puzzle={puzzle}
            solution={solution}
            onChange={bounty?.claimed ? undefined : handleCell}
            readonly={bounty?.claimed}
            highlight={conflicts}
            revealed={revealedCells}
          />
          <div className="text-sm text-slate-400">
            {complete ? (
              <span className="text-teal-400 font-semibold">Grid complete — ready to prove</span>
            ) : (
              `${filled} / ${blanks} cells filled`
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 flex flex-col gap-4">
          {!isConnected && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <p className="text-slate-300 mb-3 text-sm">Connect your wallet to solve</p>
              <ConnectButton />
            </div>
          )}

          {bounty?.claimed ? (
            <div className="p-5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-center">
              <p className="text-teal-400 font-semibold text-lg mb-1">Puzzle solved!</p>
              <p className="text-slate-400 text-sm">
                Solved by {bounty.solver.slice(0, 6)}…{bounty.solver.slice(-4)}
              </p>
            </div>
          ) : (
            <>
              {/* Prove & Claim */}
              <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0e1528]">
                <h3 className="font-mono font-semibold mb-1">Prove & Claim</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Fill the grid, generate a ZK proof in-browser, submit on-chain.
                  Your solution is never revealed.
                </p>

                {stage === "proving" && (
                  <div className="mb-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">
                    Generating ZK proof… ~30 s
                  </div>
                )}
                {stage === "done" && (
                  <div className="mb-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-sm text-teal-300">
                    Bounty claimed! Check your wallet and SolveX NFT.
                  </div>
                )}
                {errMsg && (
                  <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                    {errMsg}
                  </div>
                )}

                <button
                  onClick={handleProveAndClaim}
                  disabled={!complete || !isConnected || stage === "proving" || isPending || isConfirming}
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-colors"
                >
                  {stage === "proving"          ? "Generating proof…"
                    : isPending || isConfirming ? "Confirming on-chain…"
                    : stage === "done"          ? "Claimed!"
                    : "Prove & Claim Bounty"}
                </button>
              </div>

              {/* Hints */}
              {hintableCells.length > 0 && (
                <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0e1528]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono font-semibold">Buy Hints</h3>
                    <span className="text-[11px] text-slate-500 font-mono">$0.001 USDC / cell</span>
                  </div>
                  <p className="text-slate-400 text-xs mb-4">
                    Reveal a cell&apos;s correct value. Payment goes to the puzzle creator.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hintableCells.map(({ i }) => {
                      const row = Math.floor(i / 9) + 1;
                      const col = (i % 9) + 1;
                      const loading = hintLoading.has(i);
                      return (
                        <button
                          key={i}
                          onClick={() => buyHint(i)}
                          disabled={loading || !isConnected}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontFamily: "var(--font-mono), monospace",
                            fontWeight: 600,
                            cursor: loading || !isConnected ? "not-allowed" : "pointer",
                            border: "0.5px solid rgba(79,70,229,0.4)",
                            background: loading ? "rgba(79,70,229,0.1)" : "transparent",
                            color: loading ? "#818cf8" : "#64748b",
                            opacity: !isConnected ? 0.4 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {loading ? "…" : `💡 R${row}C${col}`}
                        </button>
                      );
                    })}
                  </div>
                  {Object.keys(hints).length > 0 && (
                    <p className="mt-3 text-[11px] text-indigo-400 font-mono">
                      {Object.keys(hints).length} hint{Object.keys(hints).length !== 1 ? "s" : ""} purchased
                    </p>
                  )}
                </div>
              )}

              {/* Boost Bounty */}
              <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0e1528]">
                <h3 className="font-mono font-semibold mb-1">Boost the Bounty</h3>
                <p className="text-slate-400 text-sm mb-3">Add to the prize pool to attract solvers.</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount (ETH)"
                    value={bountyAmount}
                    onChange={(e) => setBountyAmount(e.target.value)}
                    className="flex-1 bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  <button
                    onClick={handleContribute}
                    disabled={!isConnected || !bountyAmount || isPending}
                    className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
                  >
                    Contribute
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
