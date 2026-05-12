# SolveX — ZK Puzzle Bounty Market

> Post a Sudoku puzzle with a USDC bounty.  
> Prove you solved it on-chain — without ever revealing the solution.

Built on **Arc Testnet** · Groth16 ZK proofs · Solidity + Foundry · Next.js

---

## How It Works

1. **Post** — Creator submits an 81-cell Sudoku puzzle + USDC bounty + deadline
2. **Boost** — Anyone can top up the prize pool (crowdfunded bounties)
3. **Solve** — Solver fills the grid in the browser
4. **Prove** — snarkjs generates a Groth16 ZK proof client-side (~30 s)
5. **Claim** — Proof submitted on-chain; contract verifies it and releases the bounty
6. **Credential** — Solver receives a soulbound NFT as proof-of-skill

The ZK circuit enforces all Sudoku rules (row/column/box uniqueness + clue matching). The solver's answer is **never revealed on-chain** — only the proof is.

---

## Project Structure

```
solvex/
├── circuits/           Circom circuit — full Sudoku constraint system
├── contracts/          Foundry project
│   ├── src/
│   │   ├── BountyMarket.sol   Core protocol contract
│   │   ├── SolverNFT.sol      Soulbound credential NFT
│   │   └── interfaces/
│   ├── script/Deploy.s.sol
│   └── test/BountyMarket.t.sol
├── scripts/            Circuit compile + trusted setup + proof generation
└── frontend/           Next.js 14 app (App Router)
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- Circom ≥ 2.0 (`npm i -g circom`)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- Arc Testnet USDC from the [Circle Faucet](https://faucet.circle.com)

### 1 — Install dependencies

```bash
# Circuit / scripts
cd scripts && npm install

# Contracts
cd ../contracts && forge install \
  OpenZeppelin/openzeppelin-contracts \
  foundry-rs/forge-std

# Frontend
cd ../frontend && npm install
```

### 2 — Compile the circuit

```bash
cd scripts
bash 1_compile.sh
```

Outputs `artifacts/sudoku.r1cs`, `artifacts/sudoku_js/sudoku.wasm` etc.

### 3 — Trusted setup

```bash
bash 2_setup.sh
```

Downloads `pot14_final.ptau` (~85 MB, Hermez ceremony), runs Phase 2 setup,
exports `contracts/src/Verifier.sol` and copies wasm + zkey to `frontend/public/`.

> **Production note:** For mainnet, run a proper multi-party ceremony
> rather than a single-contributor setup.

### 4 — Deploy contracts

```bash
cd contracts
cp .env.example .env   # fill in PRIVATE_KEY and VERIFIER_ADDRESS

# Deploy Verifier first
forge create src/Verifier.sol:Groth16Verifier \
  --rpc-url arc_testnet --private-key $PRIVATE_KEY

# Set VERIFIER_ADDRESS in .env, then deploy market + NFT
forge script script/Deploy.s.sol \
  --rpc-url arc_testnet --broadcast --private-key $PRIVATE_KEY
```

Copy the output addresses into `frontend/.env`.

### 5 — Run the frontend

```bash
cd frontend
cp .env.example .env   # fill in contract addresses + WalletConnect project ID
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Contracts (Arc Testnet)

| Contract     | Address |
|--------------|---------|
| BountyMarket | `TBD — fill after deploy` |
| SolverNFT    | `TBD — fill after deploy` |
| Verifier     | `TBD — fill after deploy` |

---

## Run Tests

```bash
cd contracts
forge test -vvv
```

All 8 unit tests cover: post, contribute, claim, double-claim prevention,
expiry, refund, protocol fees, and soulbound transfer revert.

---

## Generate a Proof (CLI)

```bash
cd scripts
node 3_generate_proof.js puzzle.json solution.json
# outputs proof_calldata.json with formatted pA, pB, pC, pubSignals
```

---

## Circuit Design

The `Sudoku()` circuit in `circuits/sudoku.circom`:

| Signal | Visibility | Description |
|--------|-----------|-------------|
| `puzzle[81]`   | **public**  | Clue grid (0 = blank, 1-9 = given) |
| `solution[81]` | **private** | Full solution (never revealed) |

Constraints enforced:
- Each solution cell is in `[1, 9]`
- For every non-zero puzzle cell, `solution[i] == puzzle[i]`
- Every row contains `{1…9}` exactly once
- Every column contains `{1…9}` exactly once
- Every 3×3 box contains `{1…9}` exactly once

Requires `pot14_final.ptau` (~16 384 constraints).

---

## Uniqueness Features

| Feature | Description |
|---------|-------------|
| ZK proofs | Solution privacy guaranteed on-chain |
| Crowdfunded pools | Anyone adds to the bounty |
| Soulbound NFT | Non-transferable proof-of-skill credential |
| 2.5% protocol fee | Self-sustaining without a token |
| Creator refund | Unclaimed pool returned after deadline |
| On-chain SVG NFT | No IPFS dependency |

---

## Roadmap

- [ ] Multi-puzzle-type registry (extend beyond Sudoku)
- [ ] Hint micropayments (creator earns from hints)
- [ ] Time-escalating bounty curve
- [ ] Proof aggregation for gas efficiency
- [ ] Mainnet deployment (Arc Mainnet)
