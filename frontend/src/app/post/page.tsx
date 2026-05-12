"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";
import { SudokuGrid } from "@/components/SudokuGrid";
import { BOUNTY_MARKET_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";

const EMPTY = Array(81).fill(0);

export default function PostPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const [puzzle,     setPuzzle]     = useState<number[]>([...EMPTY]);
  const [title,      setTitle]      = useState("");
  const [bountyUsdc, setBountyUsdc] = useState("1");
  const [days,       setDays]       = useState(7);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const [error,      setError]      = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleCell = useCallback((idx: number, val: number) => {
    setPuzzle((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  const clueCount = puzzle.filter((v) => v !== 0).length;

  function validate() {
    if (!title.trim()) return "Title is required";
    if (clueCount < 17) return "A valid Sudoku puzzle needs at least 17 clues";
    const amount = parseFloat(bountyUsdc);
    if (isNaN(amount) || amount <= 0) return "Bounty must be > 0";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");

    const deadline = BigInt(Math.floor(Date.now() / 1000) + days * 86400);

    writeContract({
      address:      CONTRACT_ADDRESSES.bountyMarket,
      abi:          BOUNTY_MARKET_ABI,
      functionName: "postBounty",
      args: [puzzle as unknown as readonly number[], deadline, difficulty, title],
      value:        parseEther(bountyUsdc),
    });
  }

  if (isSuccess) {
    router.push("/");
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Post a Puzzle</h1>
      <p className="text-slate-400 mb-8">
        Set the clue cells, add a USDC bounty, and let solvers compete.
      </p>

      {!isConnected && (
        <div className="mb-8 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between">
          <span className="text-slate-300">Connect your wallet to post</span>
          <ConnectButton />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Puzzle editor */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Puzzle Grid
            <span className="ml-2 text-slate-500 font-normal">
              ({clueCount} clue{clueCount !== 1 ? "s" : ""} — need ≥ 17)
            </span>
          </label>
          <div className="flex justify-center">
            <SudokuGrid
              puzzle={EMPTY}
              solution={puzzle}
              onChange={handleCell}
            />
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Click a cell and type 1-9 to add a clue. Backspace to clear.
          </p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning warm-up"
              maxLength={60}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={[
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
                    difficulty === d
                      ? d === 1 ? "bg-green-600 text-white"
                        : d === 2 ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white",
                  ].join(" ")}
                >
                  {d === 1 ? "Easy" : d === 2 ? "Medium" : "Hard"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Bounty (USDC)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={bountyUsdc}
              onChange={(e) => setBountyUsdc(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Open for (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={!isConnected || isPending || isConfirming}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
        >
          {isPending || isConfirming ? "Confirming…" : `Post with ${bountyUsdc} USDC bounty`}
        </button>
      </form>
    </div>
  );
}
