"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BountyCard } from "@/components/BountyCard";
import { BOUNTY_MARKET_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import type { BountyData } from "@/lib/types";

const DIFF_FILTERS = [
  { label: "All",    value: 0 },
  { label: "Easy",   value: 1 },
  { label: "Medium", value: 2 },
  { label: "Hard",   value: 3 },
];

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

        // Sort: open first, then by pool descending
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

  const visible = filter === 0
    ? bounties
    : bounties.filter((b) => b.difficulty === filter);

  return (
    <>
      {/* Hero */}
      <section className="text-center mb-14">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Solve<span className="text-indigo-400">X</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          Post a Sudoku puzzle with a USDC bounty.
          Prove you solved it on-chain — without ever revealing the solution.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <ConnectButton />
          <a
            href="/post"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            + Post Puzzle
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-10 text-center">
        {[
          { label: "Open Bounties", value: bounties.filter((b) => !b.claimed).length },
          { label: "Solved",        value: bounties.filter((b) =>  b.claimed).length },
          { label: "Total Puzzles", value: bounties.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
            <div className="text-2xl font-bold">{loading ? "—" : s.value}</div>
            <div className="text-slate-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {DIFF_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as 0 | 1 | 2 | 3)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bounty grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-20">Loading bounties…</div>
      ) : visible.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          No bounties yet.{" "}
          <a href="/post" className="text-indigo-400 hover:underline">
            Post the first one.
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((b) => (
            <BountyCard key={b.id.toString()} bounty={b} />
          ))}
        </div>
      )}
    </>
  );
}
