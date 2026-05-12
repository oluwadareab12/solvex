"use client";

import Link from "next/link";
import type { BountyData } from "@/lib/types";
import { formatEther } from "viem";

const DIFF_LABEL = ["", "Easy", "Medium", "Hard"] as const;
const DIFF_COLOR = ["", "text-green-400 bg-green-400/10", "text-yellow-400 bg-yellow-400/10", "text-red-400 bg-red-400/10"] as const;

function timeLeft(deadline: bigint): string {
  const secs = Number(deadline) - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "Expired";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function BountyCard({ bounty }: { bounty: BountyData }) {
  const diff = bounty.difficulty as 1 | 2 | 3;
  const expired = Number(bounty.deadline) < Date.now() / 1000;

  return (
    <Link
      href={`/solve/${bounty.id}`}
      className="block rounded-xl border border-white/10 bg-slate-800/60 hover:bg-slate-800 hover:border-indigo-500/50 transition-all p-5 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
          {bounty.title}
        </h3>
        <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${DIFF_COLOR[diff]}`}>
          {DIFF_LABEL[diff]}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-slate-400">Pool</span>
          <span className="text-white font-bold text-lg">
            {parseFloat(formatEther(bounty.pool)).toFixed(2)}
            <span className="text-slate-400 text-sm font-normal ml-1">USDC</span>
          </span>
        </div>

        {bounty.claimed ? (
          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-semibold">
            Solved
          </span>
        ) : (
          <div className="text-right">
            <span className="text-slate-400 text-xs block">Deadline</span>
            <span className={`text-sm font-medium ${expired ? "text-red-400" : "text-slate-300"}`}>
              {timeLeft(bounty.deadline)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500 font-mono truncate">
        #{bounty.id.toString()} · {bounty.creator.slice(0, 6)}…{bounty.creator.slice(-4)}
      </div>
    </Link>
  );
}
