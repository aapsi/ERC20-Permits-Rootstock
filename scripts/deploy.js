const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    const SpecialToken = await ethers.ContractFactory("SpecialToken");
    const ERC20 = SpecialToken.deploy(deployer.address);

    await ERC20.deployed();

    console.log("SpecialToken deployed to:", ERC20.address);  
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

