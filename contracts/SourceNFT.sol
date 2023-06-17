// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";
import "./ERC4906.sol";

contract SourceNFT is ERC721, ERC4906, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    uint256 private MAX_SUPPLY = 1000;
    uint256 private MAX_AL_SUPPLY = 500;

    mapping(uint256 => uint256) private myNumber;
    bool private mintable;

    constructor() ERC721("SourceNFT", "SNFT") {}

    function mint() public payable returns (uint256) {
        require(mintable, "Mint is not Started");
        require(currentTokenId.current() < MAX_SUPPLY, "Mint limit exceeded");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(msg.sender, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    /// @dev ownerMint
    /// @param recipient address of recipient
    function ownerMint(address recipient) public onlyOwner returns (uint256) {
        require(currentTokenId.current() < MAX_SUPPLY, "Mint limit exceeded");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(recipient, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    /// @dev add Number metadata for specific token id
    /// @param _tokenId token id
    function addNumber(uint256 _tokenId) public {
        require(_exists(_tokenId), "tokenId must be exist");
        require(myNumber[_tokenId] < 10, "Number is already 10");
        myNumber[_tokenId] += 1;
        emit MetadataUpdate(_tokenId);
    }

    /// @dev decrease Number metadata for specific token id
    /// @param _tokenId token id
    function decreaseNumber(uint256 _tokenId) public {
        require(_exists(_tokenId), "tokenId must be exist");
        require(myNumber[_tokenId] > 0, "Number is already 0");
        myNumber[_tokenId] -= 1;
        emit MetadataUpdate(_tokenId);
    }

    ///@dev get number metadata of Token Id
    function getNumber(uint256 _tokenId) public view returns (uint256) {
        return myNumber[_tokenId];
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /// @dev get metadata for specific token id
    /// @param _tokenId token id
    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        require(_exists(_tokenId), "tokenId must be exist");
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
                '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 320 320">',
                '<rect x="10" y="10" width="300" height="300" fill="none" stroke="#fff" stroke-width="2" />'
                '<rect x="15" y="15" width="290" height="290" fill="',
                colorMap[myNumber[_tokenId]],
                '" stroke="',
                colorMap[myNumber[_tokenId]],
                '" stroke-width="2" />',
                '<circle cx="160" cy="160" r="120" stroke="white" fill="white"/>'
            )
        );
        p[1] = string(
            abi.encodePacked(
                '<text x="160" y="160" font-size="140" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="',
                colorMap[myNumber[_tokenId]],
                '">',
                Strings.toString(myNumber[_tokenId]),
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
                Strings.toString(_tokenId),
                '","description": "Source NFT amazing",',
                '"attributes": [{"trait_type":"Number","value":"',
                Strings.toString(myNumber[_tokenId]),
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

    // administrator

    /// @dev withdraw all balance to owner
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    /// @dev get mintable state
    function getMintable() public view returns (bool) {
        return mintable;
    }

    /// @dev set mintable state
    function setMintable(bool _status) public onlyOwner {
        mintable = _status;
    }

    /**
     * @dev IERC165-supportsInterface
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC4906) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
