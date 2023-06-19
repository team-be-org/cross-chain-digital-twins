const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json")
const CHAIN_IDS = require("../constants/chainIds.json")
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

      // get the Endpoint address
      let endpointAddr;
      let distChainId;
      if(hre.network.name == "hardhat") {
        //deploy endpoint contract
        let chainId = 31337; // hardhat
        distChainId = 31337; // hardhat

        let _endpoint = await ethers.getContractFactory("LZEndpointMock");
        let endpoint = await _endpoint.deploy(chainId);
        await endpoint.deployed();
        endpointAddr = endpoint.address;
      }
      else  // dist network (goerli)
      {
        endpointAddr = LZ_ENDPOINTS[hre.network.name]
        distChainId = CHAIN_IDS["goerli"]
        console.log(`[${hre.network.name}] Endpoint address: ${endpointAddr}`)
      }
  
      // deploy sourceNFTMetadata contract
      let _sourceNFTMetadata = await ethers.getContractFactory("SourceNFTMetadata");
      let sourceNFTMetadata = await _sourceNFTMetadata.deploy();  
      let sourceNFTMetadataAddr = sourceNFTMetadata.address;
      console.log("Metadata address:", sourceNFTMetadataAddr);

      // deploy sourceNFT contract
      let _sourceNFT = await ethers.getContractFactory("TwinNFT");
      let sourceNFT = await _sourceNFT.deploy(endpointAddr, sourceNFTMetadataAddr, distChainId);
      console.log("Token address:", sourceNFT.address);
  }

  main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });