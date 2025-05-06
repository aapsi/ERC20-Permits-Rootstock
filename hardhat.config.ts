import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.29",
  networks: {
    rskTestnet: {
      url: `https://public-node.testnet.rsk.co`,
      chainId: 31,
      gasPrice: "auto",
      accounts: [
        `0x${process.env.ROOTSTOCK_TESTNET_OWNER_PRIVATE_KEY}`,
        `0x${process.env.ROOTSTOCK_TESTNET_RECEIVER_PRIVATE_KEY}`,
      ],
    },
  },
};

export default config;
