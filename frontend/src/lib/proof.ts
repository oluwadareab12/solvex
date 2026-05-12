"use client";

import type { ProofCalldata } from "./types";

const WASM_URL = "/sudoku.wasm";
const ZKEY_URL = "/sudoku_final.zkey";

/**
 * Generate a Groth16 proof for a Sudoku puzzle + solution in the browser.
 * Returns formatted arguments ready for BountyMarket.claim().
 */
export async function generateProof(
  puzzle: number[],
  solution: number[]
): Promise<ProofCalldata> {
  if (puzzle.length !== 81 || solution.length !== 81) {
    throw new Error("puzzle and solution must each be 81 values");
  }

  // Dynamic import to avoid SSR issues with snarkjs
  const snarkjs = await import("snarkjs");

  const input = { puzzle, solution };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    WASM_URL,
    ZKEY_URL
  );

  // exportSolidityCallData returns a comma-separated string of JSON arrays
  const raw = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const [pA, pB, pC, pub] = JSON.parse("[" + raw + "]") as [
    string[],
    string[][],
    string[],
    string[]
  ];

  return {
    pA: [BigInt(pA[0]), BigInt(pA[1])],
    pB: [
      [BigInt(pB[0][0]), BigInt(pB[0][1])],
      [BigInt(pB[1][0]), BigInt(pB[1][1])],
    ],
    pC: [BigInt(pC[0]), BigInt(pC[1])],
    pubSignals: pub.map(BigInt),
  };
}

/** Basic client-side Sudoku validation (does not replace ZK proof). */
export function validateSudoku(grid: number[]): boolean {
  if (grid.length !== 81) return false;
  const check = (cells: number[]) => {
    const s = new Set(cells);
    return s.size === 9 && !s.has(0) && Math.min(...cells) >= 1 && Math.max(...cells) <= 9;
  };
  for (let i = 0; i < 9; i++) {
    const row = grid.slice(i * 9, i * 9 + 9);
    const col = Array.from({ length: 9 }, (_, r) => grid[r * 9 + i]);
    const br = Math.floor(i / 3) * 3;
    const bc = (i % 3) * 3;
    const box = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => grid[(br + r) * 9 + bc + c]));
    if (!check(row) || !check(col) || !check(box)) return false;
  }
  return true;
}
