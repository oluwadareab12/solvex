"use client";

import Link from "next/link";
import { formatEther } from "viem";
import type { BountyData } from "@/lib/types";

const DIFF_LABEL = ["", "Easy", "Medium", "Hard"] as const;

const DIFF_STYLE = [
  "",
  "text-teal-400  bg-teal-400/10  border-teal-400/20",
  "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "text-red-400   bg-red-400/10   border-red-400/20",
] as const;

function timeLeft(deadline: bigint): string {
  const secs = Number(deadline) - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "Expired";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function BountyCard({ bounty }: { bounty: BountyData }) {
  const diff    = bounty.difficulty as 1 | 2 | 3;
  const expired = Number(bounty.deadline) < Date.now() / 1000;
  const pool    = parseFloat(formatEther(bounty.pool));

  return (
    <Link
      href={`/solve/${bounty.id}`}
      className="group block rounded-xl bg-[#0e1528] border-hair hover:border-[rgba(79,70,229,0.4)] transition-all duration-200 p-5"
    >
      {/* Top row: title + difficulty */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-mono text-sm font-semibold text-white group-hover:text-[#818cf8] transition-colors leading-snug line-clamp-2">
          {bounty.title}
        </h3>
        <span className={`shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${DIFF_STYLE[diff]}`}>
          {DIFF_LABEL[diff]}
        </span>
      </div>

      {/* Pool amount */}
      <div className="mb-4">
        <div className="font-mono text-2xl font-bold text-[#818cf8]">
          {pool.toFixed(3)}
          <span className="text-sm font-normal text-slate-500 ml-1.5">ETH</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-600 mt-0.5">
          Prize pool
        </div>
      </div>

      {/* Bottom row: status + creator */}
      <div className="flex items-center justify-between">
        {bounty.claimed ? (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded">
            Solved
          </span>
        ) : (
          <span className={`text-[10px] font-mono ${expired ? "text-red-400" : "text-slate-400"}`}>
            {expired ? "Expired" : `${timeLeft(bounty.deadline)} left`}
          </span>
        )}

        <span className="font-mono text-[10px] text-slate-600">
          #{bounty.id.toString()} · {bounty.creator.slice(0, 6)}…{bounty.creator.slice(-4)}
        </span>
      </div>
    </Link>
  );
}
