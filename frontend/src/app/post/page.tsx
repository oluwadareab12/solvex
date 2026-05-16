"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";
import { SudokuGrid } from "@/components/SudokuGrid";
import { BOUNTY_MARKET_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";

const EMPTY = Array(81).fill(0);

export default function PostPage() {
  const { isConnected } = useAccount();
  const publicClient    = usePublicClient();
  const router          = useRouter();

  const [puzzle,       setPuzzle]       = useState<number[]>([...EMPTY]);
  const [fullSolution, setFullSolution] = useState<number[]>([...EMPTY]);
  const [title,        setTitle]        = useState("");
  const [bountyUsdc,   setBountyUsdc]   = useState("1");
  const [days,         setDays]         = useState(7);
  const [difficulty,   setDifficulty]   = useState<1 | 2 | 3>(1);
  const [error,        setError]        = useState("");
  const [submitted,    setSubmitted]    = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // After tx confirms: store solution then navigate home
  useEffect(() => {
    if (!isSuccess || submitted || !publicClient) return;
    setSubmitted(true);

    publicClient
      .readContract({
        address:      CONTRACT_ADDRESSES.bountyMarket,
        abi:          BOUNTY_MARKET_ABI,
        functionName: "nextBountyId",
      })
      .then((total) => {
        const bountyId = String(Number(total) - 1);
        return fetch("/api/solutions", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ bountyId, solution: fullSolution }),
        });
      })
      .catch(console.error)
      .finally(() => router.push("/"));
  }, [isSuccess, submitted, publicClient, fullSolution, router]);

  const handleClueCell = useCallback((idx: number, val: number) => {
    setPuzzle((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    // Mirror clue into solution grid (clue cells are locked there)
    setFullSolution((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  const handleSolutionCell = useCallback((idx: number, val: number) => {
    // Only allow editing cells that are not puzzle clues
    setPuzzle((prev) => {
      if (prev[idx] !== 0) return prev; // clue cell — ignore
      return prev;
    });
    setFullSolution((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  const clueCount = puzzle.filter((v) => v !== 0).length;
  const solutionFilled = fullSolution.filter((v) => v !== 0).length;

  function validate() {
    if (!title.trim()) return "Title is required";
    if (clueCount < 17) return "A valid Sudoku puzzle needs at least 17 clues";
    if (solutionFilled < 81) return "Please fill in the complete solution grid (all 81 cells)";
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Post a Puzzle</h1>
      <p className="text-slate-400 mb-8">
        Set the clue cells, fill the complete solution (used by the hint system), add a bounty.
      </p>

      {!isConnected && (
        <div className="mb-8 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between">
          <span className="text-slate-300">Connect your wallet to post</span>
          <ConnectButton />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* Clue grid */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Puzzle Clues
            <span className="ml-2 text-slate-500 font-normal">
              ({clueCount} clue{clueCount !== 1 ? "s" : ""} — need ≥ 17)
            </span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Enter only the cells you want to reveal to solvers.
          </p>
          <div className="flex justify-center">
            <SudokuGrid
              puzzle={EMPTY}
              solution={puzzle}
              onChange={handleClueCell}
            />
          </div>
        </div>

        {/* Full solution grid */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Full Solution
            <span className="ml-2 text-slate-500 font-normal">
              ({solutionFilled} / 81 cells — stored server-side for hints)
            </span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Fill every cell. Clue cells (indigo) are locked. This is never shown to solvers directly.
          </p>
          <div className="flex justify-center">
            <SudokuGrid
              puzzle={puzzle}
              solution={fullSolution}
              onChange={handleSolutionCell}
            />
          </div>
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
                      ? d === 1 ? "bg-teal-600 text-white"
                        : d === 2 ? "bg-amber-600 text-white"
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
              Bounty (ETH)
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

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!isConnected || isPending || isConfirming}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
        >
          {isPending || isConfirming ? "Confirming…" : `Post with ${bountyUsdc} ETH bounty`}
        </button>
      </form>
    </div>
  );
}
