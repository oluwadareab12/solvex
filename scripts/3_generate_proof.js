#!/usr/bin/env node
/**
 * Generate a Groth16 proof for a given Sudoku puzzle + solution.
 *
 * Usage:
 *   node scripts/3_generate_proof.js <puzzle_json> <solution_json>
 *
 * puzzle_json / solution_json: path to a JSON file containing an array of 81
 * integers (row-major order).
 *
 * Outputs formatted calldata ready to paste into the claim() call.
 */

const snarkjs = require("snarkjs");
const fs      = require("fs");
const path    = require("path");

const WASM_PATH = path.join(__dirname, "../artifacts/sudoku_js/sudoku.wasm");
const ZKEY_PATH = path.join(__dirname, "../artifacts/sudoku_final.zkey");

async function main() {
  const [,, puzzlePath, solutionPath] = process.argv;
  if (!puzzlePath || !solutionPath) {
    console.error("Usage: node 3_generate_proof.js <puzzle.json> <solution.json>");
    process.exit(1);
  }

  const puzzle   = JSON.parse(fs.readFileSync(puzzlePath,   "utf8"));
  const solution = JSON.parse(fs.readFileSync(solutionPath, "utf8"));

  if (puzzle.length !== 81 || solution.length !== 81) {
    console.error("Both files must contain exactly 81 values");
    process.exit(1);
  }

  console.log("▶  Generating witness + proof (this may take ~30 s)...");

  const input = { puzzle, solution };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    WASM_PATH,
    ZKEY_PATH
  );

  // Verify locally before outputting
  const vkey = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../artifacts/verification_key.json"),
      "utf8"
    )
  );
  const valid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  if (!valid) {
    console.error("✗  Local verification failed — check your inputs");
    process.exit(1);
  }
  console.log("✓  Proof verified locally");

  // Format for Solidity calldata
  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  // calldata is a string like: ["0x...","0x..."],["0x...","0x..."],...
  // Parse into the four arguments BountyMarket.claim() expects
  const parsed = JSON.parse("[" + calldata + "]");
  const [pA, pB, pC, pubSig] = parsed;

  const out = {
    pA,
    pB,
    pC,
    pubSignals: pubSig,
    rawCalldata: calldata,
  };

  const outPath = path.join(__dirname, "../proof_calldata.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`✓  Calldata written to ${outPath}`);
  console.log("\n── Solidity arguments ──────────────────────────────────");
  console.log("pA         :", JSON.stringify(pA));
  console.log("pB         :", JSON.stringify(pB));
  console.log("pC         :", JSON.stringify(pC));
  console.log("pubSignals :", JSON.stringify(pubSig));
}

main().catch(console.error);
