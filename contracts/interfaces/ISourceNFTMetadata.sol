// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ISourceNFTMetadata {
    function getMetadata(
        uint256 number,
        uint256 tokenId
    ) external pure returns (string memory);
}
