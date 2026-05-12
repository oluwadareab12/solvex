// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BountyMarket} from "../src/BountyMarket.sol";
import {SolverNFT} from "../src/SolverNFT.sol";

/// @notice Deploys BountyMarket + SolverNFT to Arc Testnet.
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url arc_testnet          \
///     --broadcast                    \
///     --private-key $PRIVATE_KEY
///
/// Set VERIFIER_ADDRESS in .env to the snarkJS-exported verifier contract.
contract Deploy is Script {
    function run() external {
        address verifier = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast();

        // SolverNFT needs the market address — deploy with a placeholder,
        // then deploy BountyMarket, then update via an initializer pattern.
        // For simplicity we deploy market first with a known future address
        // using CREATE2, or deploy both and wire them up.
        //
        // Simple approach: deploy NFT with zero address, deploy Market,
        // then call nft.setMarket(). But that adds a setter.
        // Instead, compute the market address deterministically:

        uint256 nonce = vm.getNonce(msg.sender);
        // Market will be deployed at nonce+1 (after NFT at nonce)
        address futureMarket = _computeAddress(msg.sender, nonce + 1);

        SolverNFT nft = new SolverNFT(futureMarket);
        BountyMarket market = new BountyMarket(verifier, address(nft));

        require(address(market) == futureMarket, "address mismatch");

        vm.stopBroadcast();

        console.log("SolverNFT   :", address(nft));
        console.log("BountyMarket:", address(market));
        console.log("Verifier    :", verifier);
    }

    /// @dev Compute contract address for a given deployer and nonce (RLP-based).
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
