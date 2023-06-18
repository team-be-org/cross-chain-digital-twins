// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC4906.sol";
import "./interfaces/ISourceNFTMetadata.sol";
import "./lzApp/NonblockingLzApp.sol";
import "hardhat/console.sol";

contract SourceNFT is ERC721, ERC4906, Ownable, NonblockingLzApp {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;
    ISourceNFTMetadata private sourceNFTMetadata;

    uint256 private MAX_SUPPLY = 100;
    uint256 private MAX_AL_SUPPLY = 100;
    uint16 dstChainId = 10121; //etheream goerli chain id

    mapping(uint256 => uint256) private myNumber;
    bool private mintable;

    constructor(
        address _endpoint,
        address _sourceNFTImageAddress,
        uint16 _dstChainId
    ) ERC721("SourceNFT", "SNFT") NonblockingLzApp(_endpoint) {
        sourceNFTMetadata = ISourceNFTMetadata(_sourceNFTImageAddress);
        dstChainId = _dstChainId;
    }

    // lzApp
    function _nonblockingLzReceive(
        uint16, // _srcChainId
        bytes memory, // _srcAddress
        uint64, // _nonce
        bytes memory _payload
    ) internal override {}

    /// @dev sendCurrentNumberInfo
    /// @param tokenId token id
    function sendChangeInfo(uint256 tokenId) internal {
        bytes memory encodedData = abi.encode(
            tokenId,
            myNumber[tokenId],
            ownerOf(tokenId)
        );
        _lzSend(
            dstChainId,
            encodedData,
            payable(msg.sender),
            address(0x0),
            bytes(""),
            msg.value
        );
    }

    function mint() public payable returns (uint256) {
        require(mintable, "Mint is not Started");
        require(currentTokenId.current() < MAX_SUPPLY, "Mint limit exceeded");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(msg.sender, newItemId);
        myNumber[newItemId] = 1;
        //sendChangeInfo(newItemId);
        return newItemId;
    }

    /// @dev add Number metadata for specific token id
    /// @param _tokenId token id
    function addNumber(uint256 _tokenId) public payable {
        require(_exists(_tokenId), "tokenId must be exist");
        require(myNumber[_tokenId] < 10, "Number is already 10");
        myNumber[_tokenId] += 1;
        emit MetadataUpdate(_tokenId);

        //send info to other chain
        sendChangeInfo(_tokenId);
    }

    /// @dev decrease Number metadata for specific token id
    /// @param _tokenId token id
    function decreaseNumber(uint256 _tokenId) public payable {
        require(_exists(_tokenId), "tokenId must be exist");
        require(myNumber[_tokenId] > 0, "Number is already 0");
        myNumber[_tokenId] -= 1;
        emit MetadataUpdate(_tokenId);

        //send info to other chain
        sendChangeInfo(_tokenId);
    }

    ///@dev get number metadata of Token Id
    function getNumber(uint256 _tokenId) public view returns (uint256) {
        return myNumber[_tokenId];
    }

    /// @dev get metadata for specific token id
    /// @param _tokenId token id
    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        require(_exists(_tokenId), "tokenId must be exist");
        return sourceNFTMetadata.getMetadata(myNumber[_tokenId], _tokenId);
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
