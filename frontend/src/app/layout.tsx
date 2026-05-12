import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SolveX — ZK Puzzle Bounty Market",
  description:
    "Post a Sudoku puzzle with a USDC bounty. Prove you solved it on-chain without revealing the solution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} bg-slate-900 text-white antialiased min-h-screen`}>
        <Providers>
          <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="text-xl font-bold tracking-tight">
                Solve<span className="text-indigo-400">X</span>
              </a>
              <div className="flex items-center gap-4">
                <a href="/post" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Post Puzzle
                </a>
                {/* RainbowKit connect button */}
                <div id="connect-btn" />
              </div>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
