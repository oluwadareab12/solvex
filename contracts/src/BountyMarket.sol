// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVerifier} from "./interfaces/IVerifier.sol";
import {SolverNFT} from "./SolverNFT.sol";

/// @title BountyMarket
/// @notice Post a Sudoku puzzle with a native-USDC bounty. Anyone who proves
///         they know a valid solution (via Groth16 ZK proof) claims the pool.
///
/// Arc network uses USDC as its native gas token, so bounties are held as
/// msg.value / address.call{value} — no ERC-20 transfers needed.
contract BountyMarket is ReentrancyGuard {

    // ── Types ────────────────────────────────────────────────────────────────

    struct Bounty {
        bytes32 puzzleHash;    // keccak256(abi.encodePacked(puzzle)) — integrity check
        uint256 pool;          // total native-USDC bounty (wei units)
        address creator;
        uint256 deadline;      // unix timestamp
        bool claimed;
        address solver;
        uint8 difficulty;      // 1 = easy | 2 = medium | 3 = hard
        string title;
    }

    // ── State ─────────────────────────────────────────────────────────────────

    IVerifier public immutable verifier;
    SolverNFT  public immutable solverNFT;

    address public owner;
    uint256 public protocolBalance;

    uint16 public constant FEE_BPS = 250; // 2.5%

    uint256 public nextBountyId;
    mapping(uint256 => Bounty) private _bounties;

    // Full puzzle stored separately to keep the Bounty struct gas-efficient
    mapping(uint256 => uint8[81]) private _puzzles;

    // ── Events ────────────────────────────────────────────────────────────────

    event BountyPosted(
        uint256 indexed id,
        address indexed creator,
        uint256 pool,
        uint8 difficulty,
        string title,
        uint256 deadline
    );
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amount);
    event BountyClaimed(uint256 indexed id, address indexed solver, uint256 payout);
    event BountyRefunded(uint256 indexed id, uint256 amount);
    event FeeWithdrawn(uint256 amount);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _verifier, address _solverNFT) {
        verifier  = IVerifier(_verifier);
        solverNFT = SolverNFT(_solverNFT);
        owner = msg.sender;
    }

    // ── Core functions ────────────────────────────────────────────────────────

    /// @notice Post a puzzle with a bounty.
    /// @param puzzle   81-element array; 0 = blank cell, 1-9 = given digit.
    /// @param deadline Unix timestamp after which unclaimed bounty can be refunded.
    /// @param difficulty 1 easy / 2 medium / 3 hard.
    /// @param title    Short human-readable title for the puzzle.
    function postBounty(
        uint8[81] calldata puzzle,
        uint256 deadline,
        uint8 difficulty,
        string calldata title
    ) external payable returns (uint256 id) {
        require(msg.value > 0,               "zero bounty");
        require(deadline > block.timestamp,  "deadline in past");
        require(difficulty >= 1 && difficulty <= 3, "bad difficulty");
        require(bytes(title).length > 0,     "empty title");

        bytes32 hash = keccak256(abi.encodePacked(puzzle));
        id = nextBountyId++;

        _bounties[id] = Bounty({
            puzzleHash: hash,
            pool:       msg.value,
            creator:    msg.sender,
            deadline:   deadline,
            claimed:    false,
            solver:     address(0),
            difficulty: difficulty,
            title:      title
        });
        _puzzles[id] = puzzle;

        emit BountyPosted(id, msg.sender, msg.value, difficulty, title, deadline);
    }

    /// @notice Anyone can top up an open bounty's pool.
    function contribute(uint256 id) external payable {
        Bounty storage b = _bounties[id];
        require(!b.claimed,                  "already claimed");
        require(block.timestamp < b.deadline,"expired");
        require(msg.value > 0,               "zero amount");

        b.pool += msg.value;
        emit Contributed(id, msg.sender, msg.value);
    }

    /// @notice Submit a Groth16 proof for a bounty's puzzle and claim the pool.
    /// @param id        Bounty ID.
    /// @param pA        Proof element A.
    /// @param pB        Proof element B.
    /// @param pC        Proof element C.
    /// @param pubSignals The 81 public puzzle signals (must match stored puzzle).
    function claim(
        uint256 id,
        uint256[2]    calldata pA,
        uint256[2][2] calldata pB,
        uint256[2]    calldata pC,
        uint256[81]   calldata pubSignals
    ) external nonReentrant {
        Bounty storage b = _bounties[id];
        require(!b.claimed,                  "already claimed");
        require(block.timestamp < b.deadline,"expired");

        // Verify the prover used the correct public puzzle
        uint8[81] storage stored = _puzzles[id];
        for (uint256 i = 0; i < 81; i++) {
            require(pubSignals[i] == stored[i], "puzzle mismatch");
        }

        // Verify the ZK proof
        require(verifier.verifyProof(pA, pB, pC, pubSignals), "invalid proof");

        b.claimed = true;
        b.solver  = msg.sender;

        uint256 fee    = (b.pool * FEE_BPS) / 10_000;
        uint256 payout = b.pool - fee;
        protocolBalance += fee;

        (bool ok,) = msg.sender.call{value: payout}("");
        require(ok, "transfer failed");

        solverNFT.mint(msg.sender, id, b.difficulty, b.puzzleHash);

        emit BountyClaimed(id, msg.sender, payout);
    }

    /// @notice Creator can reclaim pool after deadline if unclaimed.
    function refund(uint256 id) external nonReentrant {
        Bounty storage b = _bounties[id];
        require(!b.claimed,                   "already claimed");
        require(block.timestamp >= b.deadline,"not expired yet");
        require(msg.sender == b.creator,      "not creator");

        uint256 amount = b.pool;
        b.pool = 0;

        (bool ok,) = b.creator.call{value: amount}("");
        require(ok, "refund failed");

        emit BountyRefunded(id, amount);
    }

    /// @notice Protocol owner withdraws accumulated fees.
    function withdrawFees() external nonReentrant {
        require(msg.sender == owner, "not owner");
        uint256 amount = protocolBalance;
        protocolBalance = 0;
        (bool ok,) = owner.call{value: amount}("");
        require(ok, "withdraw failed");
        emit FeeWithdrawn(amount);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    function getBounty(uint256 id) external view returns (Bounty memory) {
        return _bounties[id];
    }

    function getPuzzle(uint256 id) external view returns (uint8[81] memory) {
        return _puzzles[id];
    }

    /// @notice Returns all bounty IDs in a paginated range [from, to).
    function getBountyIds(uint256 from, uint256 to)
        external
        view
        returns (uint256[] memory ids)
    {
        if (to > nextBountyId) to = nextBountyId;
        ids = new uint256[](to - from);
        for (uint256 i = from; i < to; i++) {
            ids[i - from] = i;
        }
    }
}
