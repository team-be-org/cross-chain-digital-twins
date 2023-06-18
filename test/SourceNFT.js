/* eslint-disable no-undef */
const { expect } = require("chai");
var fs = require("fs");

describe("SourceNFT", function () {
  let token721;
  let twin721;
  let _name="SourceNFT";
  let _symbol="SNFT";
  let chainId = 1337; //1337 is hardhat chainId
  let a1, a2, a3,a4, a5;
  let addNumberPay = ethers.utils.parseEther("0.02");

  beforeEach(async function () {
    [owner, a1, a2, a3, a4, a5] = await ethers.getSigners();

    // deploy endpoint mock
    let _endpoint = await ethers.getContractFactory("LZEndpointMock");
    let endpoint = await _endpoint.deploy(chainId);

    // deploy metadata contract
    let _meta = await ethers.getContractFactory("SourceNFTMetadata");
    let meta = await _meta.deploy();

    // deploy Source NFT contract
    let token = await ethers.getContractFactory("SourceNFT");
    token721 = await token.deploy(endpoint.address, meta.address, chainId); 
    let twin = await ethers.getContractFactory("TwinNFT");
    twin721 = await twin.deploy(endpoint.address, meta.address, chainId); 

    endpoint.setDestLzEndpoint(token721.address, endpoint.address);
    endpoint.setDestLzEndpoint(twin721.address, endpoint.address);

    token721.setTrustedRemote(
      chainId,
      ethers.utils.solidityPack(["address", "address"], [twin721.address, token721.address])
    );
    twin721.setTrustedRemote(
      chainId,
      ethers.utils.solidityPack(["address", "address"], [token721.address, twin721.address])
    );
  });

  describe("Deployment", function () {
    
    it("Should has the correct name and symbol ", async function () {
      expect(await token721.name()).to.equal(_name);
      expect(await token721.symbol()).to.equal(_symbol);
    });

    it("Should mint a token by account1", async function () {
      await token721.setMintable(true);
      await token721.connect(a1).mint();
      expect(await token721.ownerOf(1)).to.equal(a1.address);
      expect((await token721.balanceOf(a1.address))).to.equal(1);    
    });

    it("Should output tokeURI", async function () {
      await token721.setMintable(true);
      await token721.connect(a1).mint();

      let tokenURI = await token721.tokenURI(1);
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      //console.log(metaData);
      metaData = JSON.parse(metaData);
      expect(metaData.name).to.equal("Source NFT #1");
      expect(metaData.description).to.equal("Source NFT amazing");
      expect(metaData.attributes[0].trait_type).to.equal("Number");
      expect(metaData.attributes[0].value).to.equal("1");
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/test1.svg", image);
    });

    it("Should output tokeURI", async function () {
      await token721.setMintable(true);
      await token721.connect(a1).mint();
      await token721.connect(a1).addNumber(1, { value: addNumberPay});

      let tokenURI = await token721.tokenURI(1);
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      //console.log(metaData);
      metaData = JSON.parse(metaData);
      expect(metaData.name).to.equal("Source NFT #1");
      expect(metaData.description).to.equal("Source NFT amazing");
      expect(metaData.attributes[0].trait_type).to.equal("Number");
      expect(metaData.attributes[0].value).to.equal("2");
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/test2.svg", image);

      for (let i=0; i<8; i++) {
        await token721.connect(a1).addNumber(1, { value: addNumberPay});
        tokenURI = await token721.tokenURI(1);
        metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
        metaData = JSON.parse(metaData);
        //console.log(metaData.attributes[0].value);
        image = metaData.image.split(",")[1];
        image = Buffer.from(image, 'base64').toString('ascii');
        const filename = "tmp/test" + (i+3) + ".svg";
        fs.writeFileSync(filename, image);
      }
    });

    //ERC165 related
    it("implements ERC721", async function () {
      const result = await token721.supportsInterface("0x80ac58cd");
      expect(result).to.be.true;
    });

    it("implements ERC4906", async function () {
        const result = await token721.supportsInterface("0x49064906");
        expect(result).to.be.true;
    });

    //ERC4906 related
    it("emits MetadataUpdate event at ", async function () {
      await token721.setMintable(true);
      await token721.connect(a1).mint();
      await token721.connect(a2).mint();
      await expect(token721.addNumber(1, { value: addNumberPay})).emit(token721, "MetadataUpdate").withArgs(1);
      await expect(token721.decreaseNumber(1, { value: addNumberPay})).emit(token721, "MetadataUpdate").withArgs(1);
    });

    //revert tests
    it("Should revert if not mint enabled. revert with Mint is not Started", async function () {
      await expect(token721.connect(a1).mint()).to.be.revertedWith("Mint is not Started");
    });

    it('should stored ether in contract', async () => {
      await token721.setMintable(true);
      await token721.connect(a1).mint({value: ethers.utils.parseEther("1", "ether")});
      const balance = await ethers.provider.getBalance(token721.address);
      console.log("balance:", balance.toString());
      expect(balance).to.equal(ethers.utils.parseEther("1", "ether"));
    });

    it('should withdraw by owner', async () => {
      await token721.setMintable(true);
      await token721.connect(a1).mint({value: ethers.utils.parseEther("1", "ether")});
      const balance0 = await ethers.provider.getBalance(owner.address);
      await token721.withdraw();
      const balance1 = await ethers.provider.getBalance(owner.address);
      expect(balance1.sub(balance0)).to.greaterThan(ethers.utils.parseEther("0.99", "ether"));
    });
  });


  // test transfer nft
  it("Should work transfer nft", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).transferFrom(a1.address, a2.address, 1);
    await token721.connect(a2).transferFrom(a2.address, a3.address, 2);
    await token721.connect(a3).transferFrom(a3.address, a4.address, 3);
    await token721.connect(a4).transferFrom(a4.address, a1.address, 4);
  });

  // test setApprovedForAll
  it("Should work setApprovedForAll", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).setApprovalForAll(a2.address, true);
    await token721.connect(a2).setApprovalForAll(a3.address, true);
    await token721.connect(a3).setApprovalForAll(a4.address, true);
    await token721.connect(a4).setApprovalForAll(a1.address, true);
  });

  //test setApprove
  it("Should work setApprove", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).approve(a2.address, 1);
    await token721.connect(a2).approve(a3.address, 2);
    await token721.connect(a3).approve(a4.address, 3);
    await token721.connect(a4).approve(a1.address, 4);
  });

  //test safeTransferFrom
  it("Should work safeTransferFrom", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, 1);
    expect(await token721.ownerOf(1)).to.equal(a2.address);
    await token721.connect(a2)["safeTransferFrom(address,address,uint256)"](a2.address, a3.address, 2);
    expect(await token721.ownerOf(2)).to.equal(a3.address);
    await token721.connect(a3)["safeTransferFrom(address,address,uint256)"](a3.address, a4.address, 3);
    expect(await token721.ownerOf(3)).to.equal(a4.address);
    await token721.connect(a4)["safeTransferFrom(address,address,uint256)"](a4.address, a1.address, 4);
    expect(await token721.ownerOf(4)).to.equal(a1.address);
  });

  //test safeTransferFrom with data
  it("Should work safeTransferFrom with data", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1)["safeTransferFrom(address,address,uint256,bytes)"](a1.address, a2.address, 1, "0x");
    expect(await token721.ownerOf(1)).to.equal(a2.address);
    await token721.connect(a2)["safeTransferFrom(address,address,uint256,bytes)"](a2.address, a3.address, 2, "0x");
    expect(await token721.ownerOf(2)).to.equal(a3.address);
    await token721.connect(a3)["safeTransferFrom(address,address,uint256,bytes)"](a3.address, a4.address, 3, "0x");
    expect(await token721.ownerOf(3)).to.equal(a4.address);
    await token721.connect(a4)["safeTransferFrom(address,address,uint256,bytes)"](a4.address, a1.address, 4, "0x");
    expect(await token721.ownerOf(4)).to.equal(a1.address);
  });

  // test getMintable setMintable
  it("Should work getMintable setMintable", async function () {
    await token721.setMintable(true);
    expect(await token721.getMintable()).to.equal(true);
    await token721.setMintable(false);
    expect(await token721.getMintable()).to.equal(false);
  });

  // test onERC721Received
  it("Should work onERC721Received", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).setApprovalForAll(a2.address, true);
    await token721.connect(a2).setApprovalForAll(a3.address, true);
    await token721.connect(a3).setApprovalForAll(a4.address, true);
    await token721.connect(a4).setApprovalForAll(a1.address, true);
    await token721.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, 1);
    await token721.connect(a2)["safeTransferFrom(address,address,uint256)"](a2.address, a3.address, 2);
    await token721.connect(a3)["safeTransferFrom(address,address,uint256)"](a3.address, a4.address, 3);
    await token721.connect(a4)["safeTransferFrom(address,address,uint256)"](a4.address, a1.address, 4);
  });


  // addNumber revet test tokenId must be exist and  Number is already 10
  it("Should work addNumber revet test", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await expect(token721.connect(a1).addNumber(2, { value: addNumberPay})).to.be.revertedWith("tokenId must be exist");
    for(let i = 0; i < 9; i++) {
      await token721.connect(a1).addNumber(1, { value: addNumberPay});
    }
    await expect(token721.connect(a1).addNumber(1, { value: addNumberPay})).to.be.revertedWith("Number is already 10");
  });

  // decreaseNumber revet test tokenId must be exist and  Number is already 0
  it("Should work decreaseNumber revet test", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await expect(token721.connect(a1).decreaseNumber(2, { value: addNumberPay})).to.be.revertedWith("tokenId must be exist");
    await token721.connect(a1).decreaseNumber(1, { value: addNumberPay});
    await expect(token721.connect(a1).decreaseNumber(1, { value: addNumberPay})).to.be.revertedWith("Number is already 0");
  });

  //token URI require existing token
  it("Should not work tokeURI not existing token", async function () {
    await token721.setMintable(true);
    await expect(token721.connect(a1).tokenURI(2)).to.be.revertedWith("tokenId must be exist");
  });

  //withdraw by not owner
  it("Should not work withdraw by not owner", async function () {
    await expect(token721.connect(a1).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
  });
  // setMintable by not owner
  it("Should not work setMintable by not owner", async function () {
    await expect(token721.connect(a1).setMintable(true)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  // check twins mint new token with Source mint
  it("Should work check twins mint new token with Source mint", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.addNumber(1, { value: addNumberPay});
    let owner = await token721.ownerOf(1);
    expect(owner).to.equal(a1.address);
    let owner2 = await twin721.ownerOf(1);
    expect(owner2).to.equal(a1.address);
  });

  // check twins addNumber with Source addNumber
  it("Should work check twins addNumber with Source addNumber", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.addNumber(1, { value: addNumberPay});
    await token721.addNumber(1, { value: addNumberPay});
    let number = await token721.getNumber(1);
    expect(number).to.equal(3);
  });

  // check twins transfer with Source transfer
  it("Should work check twins transfer with Source transfer", async function () {
    await token721.setMintable(true);
    await token721.connect(a1).mint();
    await token721.addNumber(1, { value: addNumberPay});
    await token721.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, 1);
    await token721.addNumber(1, { value: addNumberPay});
    let owner = await token721.ownerOf(1);
    expect(owner).to.equal(a2.address);
    let owner2 = await twin721.ownerOf(1);
    expect(owner2).to.equal(a2.address);
  });
});