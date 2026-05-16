import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SolveX — ZK Puzzle Bounty Market",
  description: "Post a Sudoku puzzle with a USDC bounty. Prove you solved it on-chain without revealing the solution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} antialiased min-h-screen`} style={{ background: "#0a0f1e", color: "#e2e8f0" }}>
        <Providers>
          <header style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(10,15,30,0.85)", backdropFilter: "blur(12px)" }}>
            <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "0 1rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <a href="/" style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", textDecoration: "none", color: "#f1f5f9", fontFamily: "var(--font-mono), monospace" }}>
                Solve<span style={{ color: "#818cf8" }}>X</span>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <a href="/post" style={{ fontSize: "13px", color: "#64748b", textDecoration: "none" }}>
                  Post Puzzle
                </a>
                <div id="connect-btn" />
              </div>
            </div>
          </header>
          <main style={{ maxWidth: "1152px", margin: "0 auto", padding: "2.5rem 1rem" }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
