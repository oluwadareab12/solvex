"use client";

import { useState, useRef, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";

const AGENT_ADDRESS = "0x7366297aFB70d883DDeCc7687771592511d9Cc2d" as const;

type LogLine = { type: "log" | "error" | "success"; message: string; data?: unknown };

const LOG_COLOR: Record<string, string> = {
  log:     "#e2e8f0",
  error:   "#f87171",
  success: "#2dd4bf",
};

export default function AgentPage() {
  const publicClient = usePublicClient();
  const [balance,  setBalance]  = useState<string | null>(null);
  const [running,  setRunning]  = useState(false);
  const [lines,    setLines]    = useState<LogLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicClient) return;
    publicClient.getBalance({ address: AGENT_ADDRESS })
      .then((b) => setBalance(parseFloat(formatUnits(b, 18)).toFixed(4)))
      .catch(() => setBalance("—"));
  }, [publicClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  async function runAgent() {
    setRunning(true);
    setLines([]);
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const line = JSON.parse(part) as LogLine;
            setLines((prev) => [...prev, line]);
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (e) {
      setLines((prev) => [...prev, { type: "error", message: e instanceof Error ? e.message : String(e) }]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#818cf8", textTransform: "uppercase", fontFamily: "var(--font-mono), monospace", marginBottom: "12px" }}>
          Arc Testnet · Circle x402
        </p>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-1px", fontFamily: "var(--font-mono), monospace", marginBottom: "8px" }}>
          AI Solver Agent
        </h1>
        <p style={{ color: "#475569", fontSize: "14px" }}>
          Autonomous agent that browses open bounties, buys hints via Circle nanopayments, generates a ZK proof, and claims on-chain.
        </p>
      </div>

      {/* Wallet info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
        <div style={{ background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>Agent Wallet</div>
          <div style={{ fontSize: "13px", color: "#818cf8", fontFamily: "var(--font-mono), monospace", wordBreak: "break-all" }}>
            {AGENT_ADDRESS.slice(0, 10)}…{AGENT_ADDRESS.slice(-8)}
          </div>
        </div>
        <div style={{ background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>USDC Balance</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-mono), monospace" }}>
            {balance === null ? "…" : `${balance}`}
            <span style={{ fontSize: "13px", color: "#475569", fontWeight: 400, marginLeft: "6px" }}>USDC</span>
          </div>
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={runAgent}
        disabled={running}
        style={{
          width: "100%", padding: "16px", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
          background: running ? "#1e293b" : "#4f46e5", color: running ? "#475569" : "#fff",
          border: running ? "0.5px solid rgba(255,255,255,0.06)" : "none",
          cursor: running ? "not-allowed" : "pointer",
          fontFamily: "var(--font-mono), monospace", letterSpacing: "0.06em",
          marginBottom: "24px", transition: "background 0.2s",
        }}
      >
        {running ? "Agent running…" : "▶  Run Agent"}
      </button>

      {/* Terminal */}
      {lines.length > 0 && (
        <div style={{
          background: "#060b16", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px",
          padding: "20px", fontFamily: "var(--font-mono), monospace", fontSize: "12px",
          lineHeight: "1.7", minHeight: "200px", maxHeight: "520px", overflowY: "auto",
        }}>
          {lines.map((line, i) => (
            <div key={i} style={{ color: LOG_COLOR[line.type] ?? "#e2e8f0", display: "flex", gap: "10px" }}>
              <span style={{ color: "#334155", flexShrink: 0 }}>
                {line.type === "success" ? "✓" : line.type === "error" ? "✗" : "›"}
              </span>
              <span>{line.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Idle state hint */}
      {lines.length === 0 && !running && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#334155", fontFamily: "var(--font-mono), monospace", fontSize: "13px" }}>
          Press "Run Agent" to start solving.
        </div>
      )}
    </div>
  );
}
