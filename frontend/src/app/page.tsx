"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { BountyCard } from "@/components/BountyCard";
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
  const [bounties, setBounties] = useState<BountyData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<0 | 1 | 2 | 3>(0);

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
    <div className="space-y-14">

      {/* ── Hero ── */}
      <section className="pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#818cf8] uppercase font-mono mb-4">
              Arc Testnet · Groth16 ZK
            </p>
            <h1 className="text-4xl sm:text-[3.25rem] font-bold text-white leading-[1.1] tracking-tight">
              ZK Puzzle<br />Bounty Market
            </h1>
            <p className="mt-5 text-slate-400 text-sm leading-relaxed max-w-md">
              Post Sudoku puzzles with on-chain bounties. Solvers generate a
              Groth16 proof in-browser — the solution is never revealed.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ConnectButton />
            <a
              href="/post"
              className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-semibold transition-colors"
            >
              + Post Puzzle
            </a>
          </div>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Open Bounties",
            value: loading ? "—" : String(open.length),
          },
          {
            label: "Solved",
            value: loading ? "—" : String(solved.length),
          },
          {
            label: "Total Prizes",
            value: loading
              ? "—"
              : `${parseFloat(formatEther(totalPool)).toFixed(3)} ETH`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-[#0e1528] border-hair px-6 py-5"
          >
            <div className="font-mono text-2xl font-bold text-white">
              {s.value}
            </div>
            <div className="mt-1.5 text-[11px] uppercase tracking-widest text-slate-500">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter + grid ── */}
      <div>
        {/* Filter tabs */}
        <div className="flex gap-2 mb-7">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as 0 | 1 | 2 | 3)}
              className={[
                "px-3.5 py-1.5 rounded-md text-[11px] font-semibold tracking-widest uppercase transition-colors",
                filter === f.value
                  ? "bg-[#4f46e5] text-white"
                  : "border-hair text-slate-500 hover:text-slate-300",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-28 text-center font-mono text-sm text-slate-600">
            Loading…
          </div>
        ) : visible.length === 0 ? (
          <div className="py-28 text-center font-mono text-sm text-slate-600">
            No bounties yet.{" "}
            <a href="/post" className="text-[#818cf8] hover:underline">
              Post the first one.
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((b) => (
              <BountyCard key={b.id.toString()} bounty={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
