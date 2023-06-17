// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";
import "./interfaces/ISourceNFTMetadata.sol";

contract SourceNFTMetadata is ISourceNFTMetadata {
    function getMetadata(
        uint256 number,
        uint256 tokenId
    ) public pure returns (string memory) {
        string[11] memory colorMap = [
            "#000000",
            "#1f77b4",
            "#aec7e8",
            "#ff7f0e",
            "#ffbb78",
            "#2ca02c",
            "#98df8a",
            "#d62728",
            "#ff9896",
            "#9467bd",
            "#c5b0d5"
        ];
        string[3] memory p;
        p[0] = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">',
                // '<rect x="10" y="10" width="300" height="300" fill="none" stroke="#fff" stroke-width="2" />'
                '<rect x="15" y="15" width="290" height="290" fill="',
                colorMap[number],
                '" stroke="',
                colorMap[number],
                '" stroke-width="2" />',
                '<circle cx="160" cy="160" r="120" stroke="white" fill="white"/>'
            )
        );
        p[1] = string(
            abi.encodePacked(
                '<text x="160" y="160" font-size="140" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="',
                colorMap[number],
                '">',
                Strings.toString(number),
                "</text>"
            )
        );
        p[2] = "";
        string memory svg = string(
            abi.encodePacked(p[0], p[1], p[2], "</svg>")
        );

        string memory meta = string(
            abi.encodePacked(
                '{"name": "Source NFT #',
                Strings.toString(tokenId),
                '","description": "Source NFT amazing",',
                '"attributes": [{"trait_type":"Number","value":"',
                Strings.toString(number),
                '"}],',
                '"image": "data:image/svg+xml;base64,'
            )
        );
        string memory json = Base64.encode(
            bytes(
                string(abi.encodePacked(meta, Base64.encode(bytes(svg)), '"}'))
            )
        );
        string memory output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        return output;
    }
}
