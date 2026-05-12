#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Step 2: Trusted setup (Groth16) + export Solidity verifier
#
# Uses the Hermez Powers of Tau (pot14) — supports up to 16 384
# constraints, which is enough for the full Sudoku circuit.
#
# Download once and keep locally:
#   wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau \
#        -O pot14_final.ptau
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ARTIFACTS="../artifacts"
PTAU="./pot14_final.ptau"

if [ ! -f "$PTAU" ]; then
  echo "Downloading pot14_final.ptau (~85 MB)..."
  curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau" \
       -o "$PTAU"
fi

echo "▶  Phase 2 setup..."
snarkjs groth16 setup "$ARTIFACTS/sudoku.r1cs" "$PTAU" "${ARTIFACTS}/sudoku_0000.zkey"

echo "▶  Contribute randomness (enter any text when prompted)..."
snarkjs zkey contribute "${ARTIFACTS}/sudoku_0000.zkey" "${ARTIFACTS}/sudoku_final.zkey" \
  --name="SolveX contributor 1" -v

echo "▶  Verify final zkey..."
snarkjs zkey verify "$ARTIFACTS/sudoku.r1cs" "$PTAU" "${ARTIFACTS}/sudoku_final.zkey"

echo "▶  Export verification key..."
snarkjs zkey export verificationkey "${ARTIFACTS}/sudoku_final.zkey" "${ARTIFACTS}/verification_key.json"

echo "▶  Export Solidity verifier..."
snarkjs zkey export solidityverifier \
  "${ARTIFACTS}/sudoku_final.zkey" \
  "../contracts/src/Verifier.sol"

# Copy wasm to frontend public folder so the browser can load it
echo "▶  Copying wasm + zkey to frontend/public..."
mkdir -p ../frontend/public
cp "$ARTIFACTS/sudoku_js/sudoku.wasm"  ../frontend/public/sudoku.wasm
cp "$ARTIFACTS/sudoku_final.zkey"      ../frontend/public/sudoku_final.zkey

echo "✓  Setup done."
echo "   Next: deploy the Verifier contract, then run Deploy.s.sol"
