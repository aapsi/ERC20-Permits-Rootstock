const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SpecialToken", function () {
  // Define a fixture that deploys the SpecialToken contract
  async function deploySpecialTokenFixture() {
    // Get signers
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy the SpecialToken contract
    const SpecialTokenFactory = await ethers.getContractFactory("SpecialToken");
    const specialToken = await SpecialTokenFactory.deploy(owner.address);

    return { specialToken, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("should set the correct name", async function () {
      const { specialToken } = await loadFixture(deploySpecialTokenFixture);
      expect(await specialToken.name()).to.equal("SpecialToken");
    });

    it("should set the correct symbol", async function () {
      const { specialToken } = await loadFixture(deploySpecialTokenFixture);
      expect(await specialToken.symbol()).to.equal("SPT");
    });

    it("should mint tokens to owner on deployment", async function () {
      const { specialToken, owner } = await loadFixture(
        deploySpecialTokenFixture
      );

      // Check the total supply
      const maxSupply = await specialToken.maxSupply();
      const ownerBalance = await specialToken.balanceOf(owner.address);

      // Verify owner received all tokens
      expect(ownerBalance).to.equal(maxSupply);
    });

    it("should set the maxTotalSupply correctly", async function () {
      const { specialToken } = await loadFixture(deploySpecialTokenFixture);
      const MAX_TOTAL_SUPPLY = ethers.utils.parseEther("1000000000"); // 1 billion tokens with 18 decimals
      expect(await specialToken.maxSupply()).to.equal(MAX_TOTAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("should allow transfers between accounts", async function () {
      const { specialToken, owner, user1 } = await loadFixture(
        deploySpecialTokenFixture
      );

      // Transfer tokens from owner to user1
      const transferAmount = ethers.utils.parseEther("1000");
      await specialToken.connect(owner).transfer(user1.address, transferAmount);

      // Check the balances
      expect(await specialToken.balanceOf(user1.address)).to.equal(
        transferAmount
      );
    });

    it("should fail if sender does not have enough balance", async function () {
      const { specialToken, user1, user2 } = await loadFixture(
        deploySpecialTokenFixture
      );
      const transferAmount = ethers.utils.parseEther("1000");

      // User1 has no tokens initially
      await expect(
        specialToken.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.reverted;
    });

    it("should not allow transfers to the zero address", async function () {
      const { specialToken, owner } = await loadFixture(
        deploySpecialTokenFixture
      );
      const transferAmount = ethers.utils.parseEther("1000");

      await expect(
        specialToken
          .connect(owner)
          .transfer(ethers.constants.AddressZero, transferAmount)
      ).to.be.reverted;
    });
  });

  describe("Approvals", function () {
    it("should allow approvals and transfers", async function () {
      const { specialToken, owner, user1, user2 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const transferAmount = ethers.utils.parseEther("1000");
      await specialToken.connect(owner).approve(user1.address, transferAmount);

      await specialToken
        .connect(user1)
        .transferFrom(owner.address, user2.address, transferAmount);

      expect(await specialToken.balanceOf(user2.address)).to.equal(
        transferAmount
      );
    });

    it("should fail if sender does not have enough allowance", async function () {
      const { specialToken, owner, user1, user2 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const transferAmount = ethers.utils.parseEther("1000");
      await expect(
        specialToken
          .connect(user1)
          .transferFrom(owner.address, user2.address, transferAmount)
      ).to.be.reverted;
    });

    it("should not allow approval to the zero address", async function () {
      const { specialToken, owner } = await loadFixture(
        deploySpecialTokenFixture
      );
      const approvalAmount = ethers.utils.parseEther("1000");

      await expect(
        specialToken
          .connect(owner)
          .approve(ethers.constants.AddressZero, approvalAmount)
      ).to.be.reverted;
    });
  });

  describe("Permit", function () {
    it("should allow approvals and transfers with permit", async function () {
      const { specialToken, owner, user1, user2 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const value = ethers.utils.parseEther("1000");
      const nonce = await specialToken.nonces(owner.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Get the domain separator
      const domainSeparator = {
        name: await specialToken.name(),
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: specialToken.address,
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
        spender: user1.address,
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
      await specialToken.permit(
        owner.address,
        user1.address,
        value,
        deadline,
        sig.v,
        sig.r,
        sig.s
      );

      // Verify the allowance was set correctly
      expect(
        await specialToken.allowance(owner.address, user1.address)
      ).to.equal(value);

      // Use the allowance to transfer tokens
      await specialToken
        .connect(user1)
        .transferFrom(owner.address, user2.address, value);

      // Check balances to ensure transfer succeeded
      expect(await specialToken.balanceOf(user2.address)).to.equal(value);
    });

    it("should prevent replay attacks with same nonce", async function () {
      const { specialToken, owner, user1 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const value = ethers.utils.parseEther("1000");
      const nonce = await specialToken.nonces(owner.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domainSeparator = {
        name: await specialToken.name(),
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: specialToken.address,
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: owner.address,
        spender: user1.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await owner._signTypedData(
        domainSeparator,
        types,
        message
      );
      const sig = ethers.utils.splitSignature(signature);

      // First permit call should succeed
      await specialToken.permit(
        owner.address,
        user1.address,
        value,
        deadline,
        sig.v,
        sig.r,
        sig.s
      );

      // Second permit call with same nonce should fail
      await expect(
        specialToken.permit(
          owner.address,
          user1.address,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.reverted;
    });

    it("should prevent approvals after deadline", async function () {
      const { specialToken, owner, user1 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const value = ethers.utils.parseEther("1000");
      const nonce = await specialToken.nonces(owner.address);
      const deadline = Math.floor(Date.now() / 1000); // Current timestamp

      const domainSeparator = {
        name: await specialToken.name(),
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: specialToken.address,
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: owner.address,
        spender: user1.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await owner._signTypedData(
        domainSeparator,
        types,
        message
      );
      const sig = ethers.utils.splitSignature(signature);

      // Increase blockchain time to exceed deadline
      await time.increase(5);

      // Should fail because deadline has passed
      await expect(
        specialToken.permit(
          owner.address,
          user1.address,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.reverted;
    });

    it("should prevent approvals with invalid signatures", async function () {
      const { specialToken, owner, user1, user2 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const value = ethers.utils.parseEther("1000");
      const nonce = await specialToken.nonces(owner.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domainSeparator = {
        name: await specialToken.name(),
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: specialToken.address,
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: owner.address,
        spender: user1.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      };

      // user2 signs instead of owner - should be invalid
      const signature = await user2._signTypedData(
        domainSeparator,
        types,
        message
      );
      const sig = ethers.utils.splitSignature(signature);

      await expect(
        specialToken.permit(
          owner.address,
          user1.address,
          value,
          deadline,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.reverted;
    });
  });

  describe("EmergencyWithdraw", function () {
    it("should allow owner to withdraw tokens", async function () {
      const { specialToken, owner, user1 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const tokenAmount = ethers.utils.parseEther("1000");
      // Transfer tokens to the contract first
      await specialToken.connect(owner).transfer(specialToken.address, tokenAmount);

      await specialToken.connect(owner).emergencyWithdraw(
        specialToken.address,
        user1.address,
        tokenAmount
      );

      expect(await specialToken.balanceOf(user1.address)).to.equal(tokenAmount);
    });

    it("Should revert if amount is 0", async function () {
      const { specialToken, owner, user1 } = await loadFixture(
        deploySpecialTokenFixture
      );

      await expect(
        specialToken.connect(owner).emergencyWithdraw(
          specialToken.address,
          user1.address,
          ethers.utils.parseEther("0")
        )
      ).to.be.reverted;
    });

    it("Should revert if recipient is 0 address", async function () {
      const { specialToken, owner } = await loadFixture(
        deploySpecialTokenFixture
      );

      await expect(
        specialToken.connect(owner).emergencyWithdraw(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("1000")
        )
      ).to.be.reverted;
    });

    it("Should revert if token is 0 address", async function () {
      const { specialToken, owner } = await loadFixture(
        deploySpecialTokenFixture
      );

      await expect(
        specialToken.connect(owner).emergencyWithdraw(
          ethers.constants.AddressZero,
          owner.address,
          ethers.utils.parseEther("1000")
        )
      ).to.be.reverted;
    });

    it("Should revert if amount is greater than balance", async function () {
      const { specialToken, owner, user1 } = await loadFixture(
        deploySpecialTokenFixture
      );

      const tokenAmount = ethers.utils.parseEther("1000");
      await specialToken.connect(owner).transfer(user1.address, tokenAmount);

      await expect(
        specialToken.connect(owner).emergencyWithdraw(
          owner.address,
          owner.address,
          ethers.utils.parseEther("100000")
        )
      ).to.be.reverted;
    });
  });
});
