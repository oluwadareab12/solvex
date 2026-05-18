"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";
import { SudokuGrid } from "@/components/SudokuGrid";
import { BOUNTY_MARKET_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";

const EMPTY = Array(81).fill(0);
const DIFF_LABELS: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

const TEST_CLUES = [5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0, 8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6, 0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9];
const TEST_SOLUTION = [5,3,4,6,7,8,9,1,2, 6,7,2,1,9,5,3,4,8, 1,9,8,3,4,2,5,6,7, 8,5,9,7,6,1,4,2,3, 4,2,6,8,5,3,7,9,1, 7,1,3,9,2,4,8,5,6, 9,6,1,5,3,7,2,8,4, 2,8,7,4,1,9,6,3,5, 3,4,5,2,8,6,1,7,9];
const DIFF_COLORS: Record<number, string> = {
  1: "#2dd4bf",
  2: "#fbbf24",
  3: "#f87171",
};

export default function PostPage() {
  const { isConnected }  = useAccount();
  const publicClient     = usePublicClient();
  const router           = useRouter();

  const [puzzle,       setPuzzle]       = useState<number[]>([...EMPTY]);
  const [fullSolution, setFullSolution] = useState<number[]>([...EMPTY]);
  const [title,        setTitle]        = useState("");
  const [bountyEth,    setBountyEth]    = useState("0.001");
  const [days,         setDays]         = useState(7);
  const [difficulty,   setDifficulty]   = useState<1 | 2 | 3>(1);
  const [error,        setError]        = useState("");
  const [submitted,    setSubmitted]    = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isSuccess || submitted || !publicClient) return;
    setSubmitted(true);
    publicClient
      .readContract({
        address: CONTRACT_ADDRESSES.bountyMarket,
        abi: BOUNTY_MARKET_ABI,
        functionName: "nextBountyId",
      })
      .then((total) => {
        const bountyId = String(Number(total) - 1);
        return fetch("/api/solutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bountyId, solution: fullSolution }),
        });
      })
      .catch(console.error)
      .finally(() => router.push("/"));
  }, [isSuccess, submitted, publicClient, fullSolution, router]);

  const handleClueCell = useCallback((idx: number, val: number) => {
    setPuzzle((prev) => { const n = [...prev]; n[idx] = val; return n; });
    setFullSolution((prev) => { const n = [...prev]; n[idx] = val; return n; });
  }, []);

  const handleSolutionCell = useCallback((idx: number, val: number) => {
    setFullSolution((prev) => { const n = [...prev]; n[idx] = val; return n; });
  }, []);

  const clueCount      = puzzle.filter((v) => v !== 0).length;
  const solutionFilled = fullSolution.filter((v) => v !== 0).length;

  const loadTestPuzzle = () => {
    setPuzzle([...TEST_CLUES]);
    setFullSolution([...TEST_SOLUTION]);
    setTitle("Classic Easy #1");
    setDifficulty(1);
  };

  const handleSubmit = () => {
    setError("");
    if (clueCount < 17) {
      setError("Need at least 17 clue cells.");
      return;
    }
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    const deadline = BigInt(Math.floor(Date.now() / 1000) + days * 86400);
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.bountyMarket,
        abi: BOUNTY_MARKET_ABI,
        functionName: "postBounty",
        args: [puzzle.map(BigInt), deadline, BigInt(difficulty), title],
        value: parseEther(bountyEth),
      });
    } catch (e) {
      console.error("[PostPage] writeContract threw:", e);
      setError(e instanceof Error ? e.message : "Contract write failed");
    }
  };

  const busy = isPending || isConfirming;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#818cf8", textTransform: "uppercase", fontFamily: "var(--font-mono), monospace", marginBottom: "12px" }}>
          Arc Testnet · ZK Proof
        </p>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-1px", fontFamily: "var(--font-mono), monospace", marginBottom: "8px" }}>
          Post a Puzzle
        </h1>
        <p style={{ color: "#475569", fontSize: "14px" }}>
          Set clue cells, fill the complete solution for the hint system, then add a bounty.
        </p>
      </div>

      {!isConnected ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <p style={{ color: "#475569", marginBottom: "20px" }}>Connect your wallet to post a puzzle.</p>
          <ConnectButton />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>

          {/* Left — grids */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Clue grid */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#94a3b8", margin: 0 }}>Puzzle Clues</p>
                  <button
                    onClick={loadTestPuzzle}
                    style={{
                      fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "5px",
                      border: "0.5px solid rgba(129,140,248,0.3)", background: "transparent",
                      color: "#818cf8", cursor: "pointer", fontFamily: "var(--font-mono), monospace",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Load test puzzle
                  </button>
                </div>
                <span style={{
                  fontSize: "11px", padding: "2px 10px", borderRadius: "99px",
                  background: clueCount >= 17 ? "rgba(20,184,166,0.12)" : "rgba(239,68,68,0.12)",
                  color: clueCount >= 17 ? "#2dd4bf" : "#f87171",
                }}>
                  {clueCount} / 17+ clues
                </span>
              </div>
              <SudokuGrid
                puzzle={puzzle}
                solution={puzzle}
                onChange={handleClueCell}
              />
              <p style={{ fontSize: "12px", color: "#334155", marginTop: "8px" }}>
                Enter only cells you want to reveal to solvers.
              </p>
            </div>

            {/* Solution grid */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#94a3b8" }}>Full Solution</p>
                <span style={{
                  fontSize: "11px", padding: "2px 10px", borderRadius: "99px",
                  background: solutionFilled === 81 ? "rgba(20,184,166,0.12)" : "rgba(99,102,241,0.12)",
                  color: solutionFilled === 81 ? "#2dd4bf" : "#818cf8",
                }}>
                  {solutionFilled} / 81 cells
                </span>
              </div>
              <SudokuGrid
                puzzle={puzzle}
                solution={fullSolution}
                onChange={handleSolutionCell}
              />
              <p style={{ fontSize: "12px", color: "#334155", marginTop: "8px" }}>
                Never shown to solvers. Used only by the hint system.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Warm-up"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.08)",
                  color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Difficulty
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {([1, 2, 3] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                      border: difficulty === d ? "none" : "0.5px solid rgba(255,255,255,0.08)",
                      background: difficulty === d ? DIFF_COLORS[d] + "22" : "transparent",
                      color: difficulty === d ? DIFF_COLORS[d] : "#475569",
                      outline: difficulty === d ? `1px solid ${DIFF_COLORS[d]}44` : "none",
                    }}
                  >
                    {DIFF_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bounty */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Bounty (ETH)
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={bountyEth}
                onChange={(e) => setBountyEth(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.08)",
                  color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Duration */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Open for (days) — {days}d
              </label>
              <input
                type="range" min={1} max={30} value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", marginTop: "4px" }}>
                <span>1d</span><span>30d</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "13px" }}>
                {error}
              </div>
            )}

            {/* Summary card */}
            <div style={{ padding: "16px", borderRadius: "10px", background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#475569" }}>Bounty</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#818cf8", fontFamily: "var(--font-mono), monospace" }}>{bountyEth} ETH</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#475569" }}>Platform fee</span>
                <span style={{ fontSize: "13px", color: "#475569" }}>2.5%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#475569" }}>Solver receives</span>
                <span style={{ fontSize: "13px", color: "#2dd4bf", fontFamily: "var(--font-mono), monospace" }}>
                  {(parseFloat(bountyEth) * 0.975).toFixed(4)} ETH
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={busy}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", fontSize: "15px", fontWeight: 700,
                background: busy ? "#334155" : "#4f46e5", color: "#fff", border: "none",
                cursor: busy ? "not-allowed" : "pointer", fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.05em",
              }}
            >
              {isPending ? "Confirm in wallet…" : isConfirming ? "Posting…" : `Post with ${bountyEth} ETH bounty`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
