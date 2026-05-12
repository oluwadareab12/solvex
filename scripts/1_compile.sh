#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Step 1: Compile the Sudoku circuit and generate witness code
# Requires: circom >= 2.0.0, node >= 18
# ─────────────────────────────────────────────────────────────
set -euo pipefail

CIRCUIT_DIR="../circuits"
OUT_DIR="../artifacts"

mkdir -p "$OUT_DIR"

echo "▶  Compiling circuit..."
circom "$CIRCUIT_DIR/sudoku.circom" \
  --r1cs \
  --wasm \
  --sym  \
  --output "$OUT_DIR" \
  -l ./node_modules   # circomlib is installed here

echo "▶  Circuit stats:"
snarkjs r1cs info "$OUT_DIR/sudoku.r1cs"

echo "✓  Compile done. Artifacts in $OUT_DIR/"
