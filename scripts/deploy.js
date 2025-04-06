const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const SpecialToken = await ethers.getContractFactory("SpecialToken");
    const erc20 = await SpecialToken.deploy(deployer.address);

    await erc20.deployed();

    console.log("SpecialToken deployed to:", erc20.address);  
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

