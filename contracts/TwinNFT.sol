// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC4906.sol";
import "./interfaces/ISourceNFTMetadata.sol";
import "./lzApp/NonblockingLzApp.sol";
import "hardhat/console.sol";

contract TwinNFT is ERC721, ERC4906, Ownable, NonblockingLzApp {
    ISourceNFTMetadata private sourceNFTMetadata;
    mapping(uint256 => uint256) private myNumber;
    uint16 dstChainId;

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
    ) internal override {
        //console.log("Payload length:", _payload.length);
        uint256 tokenIdRcv;
        uint256 numberRcv;
        address addressRcv;
        (tokenIdRcv, numberRcv, addressRcv) = abi.decode(
            _payload,
            (uint256, uint256, address)
        );
        console.log(tokenIdRcv, numberRcv, addressRcv);

        if (!_exists(tokenIdRcv)) {
            _mint(addressRcv, tokenIdRcv);
        } else if (ownerOf(tokenIdRcv) != addressRcv) {
            transferFrom(ownerOf(tokenIdRcv), addressRcv, tokenIdRcv);
        } else {
            myNumber[tokenIdRcv] = numberRcv;
        }
    }

    function mint(uint256 newItemId) public payable returns (uint256) {
        _mint(msg.sender, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    /// @dev add Number metadata for specific token id
    /// @param _tokenId token id
    function setNumber(uint256 _tokenId, uint256 newNumber) public payable {
        myNumber[_tokenId] = newNumber;
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

    /**
     * @dev IERC165-supportsInterface
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC4906) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
