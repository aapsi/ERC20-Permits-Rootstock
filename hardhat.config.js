/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    rskTestnet: {
      url: `https://public-node.testnet.rsk.co`,
      chainId: 31,
      gasPrice: 60000000,
      accounts: [`0x${process.env.ROOTSTOCK_TESTNET_OWNER_PRIVATE_KEY}`, `0x${process.env.ROOTSTOCK_TESTNET_RECEIVER_PRIVATE_KEY}`]
    }
  }
};