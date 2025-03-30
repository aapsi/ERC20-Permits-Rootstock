const { ethers } = require("hardhat");

async function main() {
    const [owner, receiver] = await ethers.getSigners();

    const SpecialToken = await ethers.ContractFactory("SpecialToken");
    const ERC20 = SpecialToken.attach("");

    const value = ethers.utils.parseEther("1000");
    const nonce = await ERC20.nonces(owner.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    const receiver2 = "";

    // Get the domain separator
    const domainSeparator = {
      name: await ERC20.name(),
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: ERC20.address,
    };

    // Define the types for EIP-712
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    // Prepare the message object
    const message = {
      owner: owner.address,
      spender: receiver.address,
      value: value,
      nonce: nonce,
      deadline: deadline,
    };

    // Sign the typed data
    const signature = await owner._signTypedData(
      domainSeparator,
      types,
      message
    );

    // Split the signature
    const sig = ethers.utils.splitSignature(signature);

    // Call permit with the signature components
    await ERC20.permit(
      owner.address,
      receiver.address,
      value,
      deadline,
      sig.v,
      sig.r,
      sig.s
    );

    // Verify the allowance was set correctly
    const allowance = await ERC20.allowance(owner.address, receiver.address);
    console.log(`Receiver allowance: ${allowance}`);

    const receiver2_balance_before = await ERC20.balanceOf(receiver2);
    console.log(`Receiver2 balance before transfer: ${receiver2_balance_before}`);

    // Use the allowance to transfer tokens
    await ERC20
      .connect(receiver)
      .transferFrom(owner.address, receiver2, value);

    // Check balances to ensure transfer succeeded
    const receiver2_balance = await ERC20.balanceOf(receiver2);

    console.log(`Receiver2 balance after transfer: ${receiver2_balance}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

