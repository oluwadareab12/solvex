// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BountyMarket} from "../src/BountyMarket.sol";
import {SolverNFT} from "../src/SolverNFT.sol";
import {IVerifier} from "../src/interfaces/IVerifier.sol";

/// @dev Stub verifier: accepts any proof where pubSignals[0] != 0
contract StubVerifier is IVerifier {
    bool public shouldPass;
    constructor(bool _pass) { shouldPass = _pass; }
    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[81] calldata
    ) external view returns (bool) {
        return shouldPass;
    }
}

contract BountyMarketTest is Test {
    BountyMarket market;
    SolverNFT    nft;
    StubVerifier verifierPass;
    StubVerifier verifierFail;

    address creator = makeAddr("creator");
    address solver  = makeAddr("solver");

    uint8[81] puzzle;
    uint256[81] pubSignals;
    uint256[2]    pA;
    uint256[2][2] pB;
    uint256[2]    pC;

    function setUp() public {
        // Predict market address for SolverNFT constructor
        uint256 nonce = vm.getNonce(address(this));
        address futureMarket = _computeAddress(address(this), nonce + 2);

        verifierPass = new StubVerifier(true);
        verifierFail = new StubVerifier(false);
        nft          = new SolverNFT(futureMarket);
        market       = new BountyMarket(address(verifierPass), address(nft));

        require(address(market) == futureMarket, "address prediction failed");

        // Build a trivial puzzle (all zeros = all blank)
        for (uint8 i = 0; i < 81; i++) {
            puzzle[i]     = 0;
            pubSignals[i] = 0;
        }

        vm.deal(creator, 100 ether);
        vm.deal(solver,  10 ether);
    }

    function test_postBounty() public {
        vm.prank(creator);
        uint256 id = market.postBounty{value: 1 ether}(
            puzzle, block.timestamp + 1 days, 1, "Easy puzzle"
        );
        assertEq(id, 0);
        assertEq(market.getBounty(0).pool, 1 ether);
        assertEq(market.getBounty(0).creator, creator);
    }

    function test_contribute() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        vm.prank(solver);
        market.contribute{value: 0.5 ether}(0);

        assertEq(market.getBounty(0).pool, 1.5 ether);
    }

    function test_claimSuccess() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        uint256 balBefore = solver.balance;

        vm.prank(solver);
        market.claim(0, pA, pB, pC, pubSignals);

        // Solver got 97.5% (2.5% fee)
        assertApproxEqAbs(solver.balance - balBefore, 0.975 ether, 1e15);
        assertTrue(market.getBounty(0).claimed);
        assertEq(market.getBounty(0).solver, solver);
        assertEq(nft.solveCount(solver), 1);
        assertEq(nft.ownerOf(0), solver);
    }

    function test_claimFailsInvalidProof() public {
        // Deploy market with failing verifier
        uint256 nonce = vm.getNonce(address(this));
        address futureMarket = _computeAddress(address(this), nonce + 1);
        SolverNFT nft2 = new SolverNFT(futureMarket);
        BountyMarket market2 = new BountyMarket(address(verifierFail), address(nft2));

        vm.prank(creator);
        market2.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        vm.prank(solver);
        vm.expectRevert("invalid proof");
        market2.claim(0, pA, pB, pC, pubSignals);
    }

    function test_claimFailsExpired() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        vm.warp(block.timestamp + 2 days);

        vm.prank(solver);
        vm.expectRevert("expired");
        market.claim(0, pA, pB, pC, pubSignals);
    }

    function test_claimFailsDouble() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        vm.prank(solver);
        market.claim(0, pA, pB, pC, pubSignals);

        vm.prank(solver);
        vm.expectRevert("already claimed");
        market.claim(0, pA, pB, pC, pubSignals);
    }

    function test_refundAfterDeadline() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        vm.warp(block.timestamp + 2 days);

        uint256 balBefore = creator.balance;
        vm.prank(creator);
        market.refund(0);
        assertEq(creator.balance - balBefore, 1 ether);
    }

    function test_refundFailsBeforeDeadline() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");

        vm.prank(creator);
        vm.expectRevert("not expired yet");
        market.refund(0);
    }

    function test_soulboundNFT() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");
        vm.prank(solver);
        market.claim(0, pA, pB, pC, pubSignals);

        vm.prank(solver);
        vm.expectRevert("SolverNFT: soulbound");
        nft.transferFrom(solver, creator, 0);
    }

    function test_protocolFees() public {
        vm.prank(creator);
        market.postBounty{value: 1 ether}(puzzle, block.timestamp + 1 days, 1, "Easy");
        vm.prank(solver);
        market.claim(0, pA, pB, pC, pubSignals);

        assertEq(market.protocolBalance(), 0.025 ether);

        address owner = market.owner();
        uint256 balBefore = owner.balance;
        vm.prank(owner);
        market.withdrawFees();
        assertEq(owner.balance - balBefore, 0.025 ether);
        assertEq(market.protocolBalance(), 0);
    }

    function _computeAddress(address deployer, uint256 nonce)
        internal
        pure
        returns (address)
    {
        bytes memory data;
        if (nonce == 0x00) {
            data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, bytes1(0x80));
        } else if (nonce <= 0x7f) {
            data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, uint8(nonce));
        } else {
            data = abi.encodePacked(bytes1(0xd7), bytes1(0x94), deployer, bytes1(0x81), uint8(nonce));
        }
        return address(uint160(uint256(keccak256(data))));
    }
}
