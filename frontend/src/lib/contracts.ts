import { defineChain } from "viem";

// Arc Testnet
export const arcTestnet = defineChain({
  id: 1244,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Fill in after running Deploy.s.sol
export const CONTRACT_ADDRESSES = {
  bountyMarket: (process.env.NEXT_PUBLIC_BOUNTY_MARKET ?? "0x0") as `0x${string}`,
  solverNFT:    (process.env.NEXT_PUBLIC_SOLVER_NFT    ?? "0x0") as `0x${string}`,
};

export const BOUNTY_MARKET_ABI = [
  // Write
  {
    name: "postBounty",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "puzzle",     type: "uint8[81]" },
      { name: "deadline",   type: "uint256" },
      { name: "difficulty", type: "uint8" },
      { name: "title",      type: "string" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    name: "contribute",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id",         type: "uint256" },
      { name: "pA",         type: "uint256[2]" },
      { name: "pB",         type: "uint256[2][2]" },
      { name: "pC",         type: "uint256[2]" },
      { name: "pubSignals", type: "uint256[81]" },
    ],
    outputs: [],
  },
  {
    name: "refund",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  // Read
  {
    name: "getBounty",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "puzzleHash", type: "bytes32" },
          { name: "pool",       type: "uint256" },
          { name: "creator",    type: "address" },
          { name: "deadline",   type: "uint256" },
          { name: "claimed",    type: "bool" },
          { name: "solver",     type: "address" },
          { name: "difficulty", type: "uint8" },
          { name: "title",      type: "string" },
        ],
      },
    ],
  },
  {
    name: "getPuzzle",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "uint8[81]" }],
  },
  {
    name: "nextBountyId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Events
  {
    name: "BountyPosted",
    type: "event",
    inputs: [
      { name: "id",         type: "uint256", indexed: true },
      { name: "creator",    type: "address", indexed: true },
      { name: "pool",       type: "uint256" },
      { name: "difficulty", type: "uint8" },
      { name: "title",      type: "string" },
      { name: "deadline",   type: "uint256" },
    ],
  },
  {
    name: "BountyClaimed",
    type: "event",
    inputs: [
      { name: "id",     type: "uint256", indexed: true },
      { name: "solver", type: "address", indexed: true },
      { name: "payout", type: "uint256" },
    ],
  },
] as const;
