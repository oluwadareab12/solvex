export type Difficulty = 1 | 2 | 3;

export interface BountyData {
  id: bigint;
  puzzleHash: `0x${string}`;
  pool: bigint;
  creator: `0x${string}`;
  deadline: bigint;
  claimed: boolean;
  solver: `0x${string}`;
  difficulty: number;
  title: string;
  puzzle?: number[];
}

export interface ProofCalldata {
  pA: [bigint, bigint];
  pB: [[bigint, bigint], [bigint, bigint]];
  pC: [bigint, bigint];
  pubSignals: bigint[];
}
