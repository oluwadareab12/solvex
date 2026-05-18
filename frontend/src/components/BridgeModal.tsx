"use client";

import { useState } from "react";
import { useAccount, useSendTransaction, usePublicClient } from "wagmi";
import { BridgeKit, ArcTestnet, BaseSepolia, EthereumSepolia, OptimismSepolia } from "@circle-fin/bridge-kit";
import { createWagmiAdapter } from "@/lib/bridgeAdapter";

const SOURCE_CHAINS = [
  { label: "Base Sepolia",     chain: BaseSepolia },
  { label: "ETH Sepolia",      chain: EthereumSepolia },
  { label: "OP Sepolia",       chain: OptimismSepolia },
] as const;

type BridgeStep = { name: string; state: string; txHash?: string; explorerUrl?: string };
type Status = "idle" | "bridging" | "done" | "error";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function BridgeModal({ isOpen, onClose }: Props) {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();

  const [sourceIdx, setSourceIdx] = useState(0);
  const [amount,    setAmount]    = useState("10");
  const [status,    setStatus]    = useState<Status>("idle");
  const [steps,     setSteps]     = useState<BridgeStep[]>([]);
  const [errorMsg,  setErrorMsg]  = useState("");

  if (!isOpen) return null;

  const handleBridge = async () => {
    if (!address || !publicClient) return;
    setStatus("bridging");
    setSteps([]);
    setErrorMsg("");

    const adapter = createWagmiAdapter(
      address,
      sendTransactionAsync,
      publicClient.waitForTransactionReceipt.bind(publicClient)
    );

    const kit = new BridgeKit();

    kit.on("*", (event: { name: string; data: unknown }) => {
      const d = event.data as Record<string, unknown> | null;
      setSteps((prev) => {
        const step: BridgeStep = {
          name:        event.name,
          state:       (d?.state as string) ?? "pending",
          txHash:      d?.txHash as string | undefined,
          explorerUrl: d?.explorerUrl as string | undefined,
        };
        const idx = prev.findIndex((s) => s.name === event.name);
        if (idx >= 0) { const n = [...prev]; n[idx] = step; return n; }
        return [...prev, step];
      });
    });

    try {
      const result = await kit.bridge({
        from: { adapter, chain: SOURCE_CHAINS[sourceIdx].chain },
        to:   { adapter, chain: ArcTestnet },
        amount,
      });

      const finalSteps: BridgeStep[] = (result.steps ?? []).map((s: BridgeStep) => ({
        name:        s.name,
        state:       s.state,
        txHash:      s.txHash,
        explorerUrl: s.explorerUrl,
      }));

      setSteps(finalSteps);
      setStatus(result.state === "success" ? "done" : "error");
      if (result.state !== "success") setErrorMsg("Bridge did not complete successfully.");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Bridge failed");
      setStatus("error");
    }
  };

  const busy = status === "bridging";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />

      <div style={{
        position: "relative", width: "100%", maxWidth: "440px", margin: "0 16px",
        background: "#0a0f1e", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "16px",
        padding: "28px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <p style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#818cf8", textTransform: "uppercase", fontFamily: "var(--font-mono), monospace", marginBottom: "4px", margin: "0 0 4px" }}>
              Circle CCTP v2
            </p>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Bridge USDC to Arc
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#475569", fontSize: "22px", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {!isConnected ? (
          <p style={{ color: "#475569", textAlign: "center", padding: "24px 0", margin: 0 }}>Connect your wallet first.</p>
        ) : (
          <>
            {/* Source chain */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                From
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                {SOURCE_CHAINS.map((sc, i) => (
                  <button
                    key={i}
                    onClick={() => setSourceIdx(i)}
                    disabled={busy}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                      cursor: busy ? "not-allowed" : "pointer",
                      border: sourceIdx === i ? "none" : "0.5px solid rgba(255,255,255,0.08)",
                      background: sourceIdx === i ? "rgba(79,70,229,0.2)" : "transparent",
                      color: sourceIdx === i ? "#818cf8" : "#475569",
                      outline: sourceIdx === i ? "1px solid rgba(79,70,229,0.4)" : "none",
                    }}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* To Arc */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "rgba(129,140,248,0.05)", border: "0.5px solid rgba(129,140,248,0.2)" }}>
              <span style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>To</span>
              <span style={{ fontSize: "13px", color: "#818cf8", fontFamily: "var(--font-mono), monospace", fontWeight: 600 }}>Arc Testnet</span>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Amount (USDC)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  background: "#0e1528", border: "0.5px solid rgba(255,255,255,0.08)",
                  color: "#f1f5f9", fontSize: "15px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {steps.map((step, i) => {
                  const ok   = step.state === "success" || step.state === "complete";
                  const fail = step.state === "failed"  || step.state === "error";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: "8px",
                        background: ok ? "rgba(20,184,166,0.08)" : fail ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                        border: `0.5px solid ${ok ? "rgba(20,184,166,0.2)" : fail ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <span style={{ fontSize: "12px", color: ok ? "#2dd4bf" : fail ? "#f87171" : "#94a3b8", fontFamily: "var(--font-mono), monospace" }}>
                        {step.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: ok ? "#2dd4bf" : fail ? "#f87171" : "#475569" }}>
                          {ok ? "✓" : fail ? "✗" : "…"}
                        </span>
                        {step.explorerUrl && (
                          <a href={step.explorerUrl} target="_blank" rel="noreferrer" style={{ fontSize: "10px", color: "#818cf8", textDecoration: "none" }}>
                            ↗ tx
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error */}
            {status === "error" && errorMsg && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "13px" }}>
                {errorMsg}
              </div>
            )}

            {/* Success */}
            {status === "done" && (
              <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "8px", background: "rgba(20,184,166,0.1)", border: "0.5px solid rgba(20,184,166,0.3)", color: "#2dd4bf", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>
                Bridge complete — USDC arrived on Arc Testnet.
              </div>
            )}

            {/* CTA */}
            {status !== "done" && (
              <button
                onClick={handleBridge}
                disabled={busy || !amount || Number(amount) <= 0}
                style={{
                  width: "100%", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
                  background: busy ? "#334155" : "#4f46e5", color: "#fff", border: "none",
                  cursor: busy || !amount || Number(amount) <= 0 ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-mono), monospace", letterSpacing: "0.05em",
                }}
              >
                {busy ? "Bridging…" : `Bridge ${amount} USDC → Arc`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
