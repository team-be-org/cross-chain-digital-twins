/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();


module.exports = {
  solidity: "0.8.13",
  networks: {
    hardhat: {
      parallel: true,
      accounts: {
        count: 20, // Change if you want more wallet for test
      },
    },
    goerli: {
      url: process.env.ALC_GOERLI_URL,
      chainId: 5,
      accounts: [process.env.PRIVATE_KEY]
    },
    mumbai: {
      url: process.env.ALC_MUMBAI_URL,
      chainId: 80001,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
    //apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
