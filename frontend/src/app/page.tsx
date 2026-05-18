"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { BountyCard } from "@/components/BountyCard";
import { BridgeModal } from "@/components/BridgeModal";
import { BOUNTY_MARKET_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import type { BountyData } from "@/lib/types";

const FILTERS = [
  { label: "All",    value: 0 },
  { label: "Easy",   value: 1 },
  { label: "Medium", value: 2 },
  { label: "Hard",   value: 3 },
] as const;

export default function Home() {
  const client = usePublicClient();
  const [bounties,    setBounties]    = useState<BountyData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<0 | 1 | 2 | 3>(0);
  const [bridgeOpen,  setBridgeOpen]  = useState(false);

  useEffect(() => {
    if (!client) return;
    const load = async () => {
      setLoading(true);
      try {
        const total = await client.readContract({
          address: CONTRACT_ADDRESSES.bountyMarket,
          abi:     BOUNTY_MARKET_ABI,
          functionName: "nextBountyId",
        }) as bigint;
        const ids = Array.from({ length: Number(total) }, (_, i) => BigInt(i));
        const results = await Promise.all(
          ids.map(async (id) => {
            const b = await client.readContract({
              address: CONTRACT_ADDRESSES.bountyMarket,
              abi:     BOUNTY_MARKET_ABI,
              functionName: "getBounty",
              args: [id],
            }) as BountyData;
            return { ...b, id };
          })
        );
        setBounties(
          results.sort((a, b) => {
            if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
            return Number(b.pool - a.pool);
          })
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client]);

  const open      = bounties.filter((b) => !b.claimed);
  const solved    = bounties.filter((b) =>  b.claimed);
  const totalPool = bounties.reduce((acc, b) => acc + b.pool, 0n);

  const visible = filter === 0
    ? bounties
    : bounties.filter((b) => b.difficulty === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>

      {/* Hero */}
      <section style={{ paddingTop: "24px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#818cf8", textTransform: "uppercase", fontFamily: "var(--font-mono), monospace", marginBottom: "16px" }}>
          Arc Testnet · Groth16 ZK
        </p>
        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "20px", fontFamily: "var(--font-mono), monospace" }}>
          ZK Puzzle<br />Bounty Market
        </h1>
        <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.7, maxWidth: "480px", marginBottom: "32px" }}>
          Post Sudoku puzzles with on-chain bounties. Solvers generate a Groth16 proof in-browser — the solution is never revealed.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <ConnectButton />
          <a href="/post" style={{ padding: "10px 20px", borderRadius: "8px", background: "#4f46e5", color: "#fff", fontSize: "14px", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
            + Post Puzzle
          </a>
          <button
            onClick={() => setBridgeOpen(true)}
            style={{ padding: "10px 20px", borderRadius: "8px", background: "transparent", color: "#818cf8", fontSize: "14px", fontWeight: 600, border: "0.5px solid rgba(129,140,248,0.4)", cursor: "pointer" }}
          >
            Bridge USDC
          </button>
        </div>
        <BridgeModal isOpen={bridgeOpen} onClose={() => setBridgeOpen(false)} />
      </section>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          { label: "Open Bounties", value: loading ? "—" : String(open.length) },
          { label: "Solved",        value: loading ? "—" : String(solved.length) },
          { label: "Total Prizes",  value: loading ? "—" : `${parseFloat(formatEther(totalPool)).toFixed(3)} ETH` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "20px 24px" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono), monospace" }}>{s.value}</div>
            <div style={{ marginTop: "6px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#475569" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + grid */}
      <div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as 0 | 1 | 2 | 3)}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                border: filter === f.value ? "none" : "0.5px solid rgba(255,255,255,0.08)",
                background: filter === f.value ? "#4f46e5" : "transparent",
                color: filter === f.value ? "#fff" : "#64748b",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#334155", fontFamily: "var(--font-mono), monospace", fontSize: "14px" }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#334155", fontFamily: "var(--font-mono), monospace", fontSize: "14px" }}>
            No bounties yet.{" "}
            <a href="/post" style={{ color: "#818cf8" }}>Post the first one.</a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {visible.map((b) => (
              <BountyCard key={b.id.toString()} bounty={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
