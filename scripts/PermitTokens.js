const { ethers } = require("hardhat");

async function main() {
    const [owner, receiver] = await ethers.getSigners();

    const SpecialToken = await ethers.getContractFactory("SpecialToken");
    const ERC20 = SpecialToken.attach("0x3fe8a073C1C625385848459a09F1eDbE4136407C");
    // Replace with you deplyed contract address

    const value = ethers.utils.parseEther("1000");
    console.log("Value to transfer:", value.toString());

    const nonce = await ERC20.nonces(owner.address);
    console.log("Current nonce:", nonce.toString());
    
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    console.log("Deadline:", deadline);

    const receiver2 = "0x397a.....2f68827"; // replace with your receiver2 address

    // Get the domain separator
    const domainSeparator = {
      name: await ERC20.name(),
      version: "1",
      chainId: 31,
      verifyingContract: ERC20.address,
    };

    console.log("Domain separator:", domainSeparator);

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

    console.log("Message to sign:", message);

    // Sign the typed data
    const signature = await owner._signTypedData(
      domainSeparator,
      types,
      message
    );

    console.log("Signature:", signature);

    // Split the signature
    const sig = ethers.utils.splitSignature(signature);

    console.log("Split signature:", sig);

    // Call permit with the signature components
    const permitTx = await ERC20.permit(
      owner.address,
      receiver.address,
      value,
      deadline,
      sig.v,
      sig.r,
      sig.s
    );

    console.log("Permit transaction hash:", permitTx.hash);
    await permitTx.wait();
    console.log("Permit transaction confirmed");

    // Verify the allowance was set correctly
    const allowance = await ERC20.allowance(owner.address, receiver.address);
    console.log(`Receiver allowance: ${allowance.toString()}`);

    const receiver2_balance_before = await ERC20.balanceOf(receiver2);
    console.log(`Receiver2 balance before transfer: ${receiver2_balance_before.toString()}`);

    // Use the allowance to transfer tokens
    const transferTx = await ERC20
      .connect(receiver)
      .transferFrom(owner.address, receiver2, value);

    console.log("Transfer transaction hash:", transferTx.hash);
    await transferTx.wait();
    console.log("Transfer transaction confirmed");

    // Check balances to ensure transfer succeeded
    const receiver2_balance = await ERC20.balanceOf(receiver2);
    console.log(`Receiver2 balance after transfer: ${receiver2_balance.toString()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

