// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @notice Soulbound NFT minted to a solver on successful bounty claim.
/// Non-transferable: represents a verifiable on-chain proof-of-skill credential.
contract SolverNFT is ERC721 {
    using Strings for uint256;

    struct SolveRecord {
        uint256 bountyId;
        uint8 difficulty; // 1 easy / 2 medium / 3 hard
        bytes32 puzzleHash;
        uint256 solvedAt;
    }

    address public immutable market;
    uint256 public nextTokenId;

    mapping(uint256 => SolveRecord) public records;
    mapping(address => uint256) public solveCount;

    event Minted(address indexed solver, uint256 indexed tokenId, uint256 bountyId);

    modifier onlyMarket() {
        require(msg.sender == market, "only market");
        _;
    }

    constructor(address _market) ERC721("SolveX Credential", "SOLVEX") {
        market = _market;
    }

    function mint(
        address solver,
        uint256 bountyId,
        uint8 difficulty,
        bytes32 puzzleHash
    ) external onlyMarket returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _mint(solver, tokenId);
        records[tokenId] = SolveRecord({
            bountyId: bountyId,
            difficulty: difficulty,
            puzzleHash: puzzleHash,
            solvedAt: block.timestamp
        });
        solveCount[solver]++;
        emit Minted(solver, tokenId, bountyId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        SolveRecord memory r = records[tokenId];

        string memory diffLabel = r.difficulty == 1 ? "Easy" : r.difficulty == 2 ? "Medium" : "Hard";
        string memory color = r.difficulty == 1 ? "#22c55e" : r.difficulty == 2 ? "#f59e0b" : "#ef4444";

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:#0f172a">',
            '<rect x="20" y="20" width="360" height="360" rx="16" fill="#1e293b" stroke="', color, '" stroke-width="2"/>',
            '<text x="200" y="80" font-family="monospace" font-size="28" fill="white" text-anchor="middle" font-weight="bold">SolveX</text>',
            '<text x="200" y="115" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Proof of Knowledge</text>',
            '<rect x="140" y="135" width="120" height="36" rx="8" fill="', color, '"/>',
            '<text x="200" y="159" font-family="monospace" font-size="16" fill="white" text-anchor="middle" font-weight="bold">', diffLabel, '</text>',
            '<text x="200" y="220" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Bounty #', r.bountyId.toString(), '</text>',
            '<text x="200" y="250" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">',
            _shortHash(r.puzzleHash),
            '</text>',
            '<text x="200" y="310" font-family="monospace" font-size="22" fill="white" text-anchor="middle">&#129518;</text>',
            '<text x="200" y="355" font-family="monospace" font-size="11" fill="#475569" text-anchor="middle">ZK-verified on Arc</text>',
            '</svg>'
        ));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name":"SolveX Credential #', tokenId.toString(),
            '","description":"Zero-knowledge proof of Sudoku solution. Non-transferable.",',
            '"attributes":[',
            '{"trait_type":"Difficulty","value":"', diffLabel, '"},',
            '{"trait_type":"Bounty ID","value":"', r.bountyId.toString(), '"},',
            '{"trait_type":"Solved At","value":"', r.solvedAt.toString(), '"}',
            '],"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // ── Soulbound: block all transfers ──────────────────────────────────────

    function transferFrom(address, address, uint256) public pure override {
        revert("SolverNFT: soulbound");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("SolverNFT: soulbound");
    }

    // ── Internal helpers ────────────────────────────────────────────────────

    function _shortHash(bytes32 h) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(10);
        str[0] = "0"; str[1] = "x";
        for (uint256 i = 0; i < 4; i++) {
            str[2 + i * 2] = alphabet[uint8(h[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(h[i] & 0x0f)];
        }
        return string(str);
    }
}
