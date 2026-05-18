"use client";
import Link from "next/link";
import { formatEther } from "viem";
import type { BountyData } from "@/lib/types";

const DIFF_LABEL = ["", "Easy", "Medium", "Hard"] as const;
const DIFF_COLOR = ["", "#2dd4bf", "#fbbf24", "#f87171"] as const;
const DIFF_BG    = ["", "rgba(45,212,191,0.08)", "rgba(251,191,36,0.08)", "rgba(248,113,113,0.08)"] as const;

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
    <Link href={`/solve/${bounty.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#0e1528",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          padding: "20px",
          cursor: "pointer",
          transition: "border-color 0.15s, transform 0.15s",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.4)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <h3 style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "14px",
            fontWeight: 600,
            color: "#f1f5f9",
            lineHeight: 1.4,
            margin: 0,
            flex: 1,
          }}>
            {bounty.title}
          </h3>
          <span style={{
            flexShrink: 0,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: "99px",
            color: DIFF_COLOR[diff],
            background: DIFF_BG[diff],
            border: `0.5px solid ${DIFF_COLOR[diff]}44`,
          }}>
            {DIFF_LABEL[diff]}
          </span>
        </div>

        {/* Pool */}
        <div>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "26px",
            fontWeight: 700,
            color: "#818cf8",
            lineHeight: 1,
          }}>
            {pool.toFixed(3)}
            <span style={{ fontSize: "13px", fontWeight: 400, color: "#475569", marginLeft: "6px" }}>ETH</span>
          </div>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#334155", marginTop: "4px" }}>
            Prize pool
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "rgba(255,255,255,0.05)" }} />

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {bounty.claimed ? (
            <span style={{
              fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
              color: "#2dd4bf", background: "rgba(45,212,191,0.1)",
              border: "0.5px solid rgba(45,212,191,0.2)", padding: "3px 10px", borderRadius: "99px",
            }}>
              ✓ Solved
            </span>
          ) : (
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono), monospace",
              color: expired ? "#f87171" : "#64748b",
            }}>
              {expired ? "Expired" : `⏱ ${timeLeft(bounty.deadline)} left`}
            </span>
          )}
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "10px",
            color: "#334155",
          }}>
            #{bounty.id.toString()} · {bounty.creator.slice(0, 6)}…{bounty.creator.slice(-4)}
          </span>
        </div>
      </div>
    </Link>
  );
}
