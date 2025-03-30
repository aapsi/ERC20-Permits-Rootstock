/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    // rskMainnet: {
    //   url: "https://rpc.mainnet.rootstock.io/{YOUR_APIKEY}",
    //   chainId: 30,
    //   gasPrice: 60000000,
    //   accounts: [process.env.ROOTSTOCK_MAINNET_OWNER_PRIVATE_KEY, process.env.ROOTSTOCK_MAINNET_RECEIVER_PRIVATE_KEY2]
    // },
    // rskTestnet: {
    //   url: "https://rpc.testnet.rootstock.io/{YOUR_APIKEY}",
    //   chainId: 31,
    //   gasPrice: 60000000,
    //   accounts: [process.env.ROOTSTOCK_TESTNET_OWNER_PRIVATE_KEY, process.env.ROOTSTOCK_TESTNET_RECEIVER_PRIVATE_KEY2]
    // }
  }
};