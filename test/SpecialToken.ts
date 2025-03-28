import hre, { ethers, upgrades } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";

describe("ZODAX", function () {
  async function deployZodaxFixture() {
    const [owner, buyer, defaultAdmin, pauser, anotherAccount] =
      await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("ZODAX");
    const token = await Token.deploy(defaultAdmin.address, owner.address);

    return {
      owner,
      buyer,
      pauser,
      defaultAdmin,
      anotherAccount,
      token,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct name", async function () {
      const { token } = await loadFixture(deployZodaxFixture);

      expect(await token.name()).to.equal("ZODAX");
    });

    it("Should set the correct symbol", async function () {
      const { token } = await loadFixture(deployZodaxFixture);

      expect(await token.symbol()).to.equal("ZODX");
    });

    it("Should set the default Admin address as the default admin", async function () {
      const { token, owner, defaultAdmin } = await loadFixture(
        deployZodaxFixture
      );

      expect(
        await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), owner.address)
      ).to.be.false;
      expect(
        await token.hasRole(
          await token.DEFAULT_ADMIN_ROLE(),
          defaultAdmin.address
        )
      ).to.be.true;
    });

    it("Should set the maxTotalSupply to the 1 Billion", async function () {
      const { token, pauser, owner } = await loadFixture(deployZodaxFixture);

      expect(await token.maxSupply()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should set the initial total supply to 1 Billion", async function () {
      const { token, pauser, owner } = await loadFixture(deployZodaxFixture);

      expect(await token.totalSupply()).to.equal(
        ethers.parseEther("1000000000")
      );
    });

    it("Should set the balance of the owner to 1 Billion", async function () {
      const { token, pauser, owner } = await loadFixture(deployZodaxFixture);

      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseEther("1000000000")
      );
    });
  });

  describe("Approve", function () {
    it("Should approve spender to spend tokens", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await token
        .connect(owner)
        .approve(buyer.address, ethers.parseEther("1000"));
      expect(await token.allowance(owner.address, buyer.address)).to.equal(
        ethers.parseEther("1000")
      );
    });

    it("Should not allow approval to the zero address", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await expect(
        token.connect(owner).approve(ethers.ZeroAddress, 1000)
      ).to.be.revertedWithCustomError(token, "ERC20InvalidSpender");
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await token
        .connect(owner)
        .transfer(buyer.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(buyer.address)).to.equal(
        ethers.parseEther("1000")
      );
    });

    it("Should not allow transfers to the zero address", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await expect(
        token.connect(owner).transfer(ethers.ZeroAddress, 1000)
      ).to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
    });

    it("Should not allow transfers from the zero address", async function () {
      it("Should not allow transfers from the zero address", async function () {
        const { token, owner, buyer } = await loadFixture(deployZodaxFixture);

        await expect(
          token.transferFrom(ethers.ZeroAddress, buyer.address, 1000)
        ).to.be.revertedWithCustomError(token, "ERC20InvalidSender");
      });
    });

    it("Should not allow transfers when sender has insufficient balance", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await expect(
        token.connect(buyer).transfer(owner.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("TransferFrom", function () {
    it("Should transfer tokens from approved spender", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await token
        .connect(owner)
        .approve(buyer.address, ethers.parseEther("1000"));
      await token
        .connect(buyer)
        .transferFrom(owner.address, buyer.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(buyer.address)).to.equal(
        ethers.parseEther("1000")
      );
    });

    it("Should not allow transfers to the zero address", async function () {
      const { token, pauser, owner, buyer } = await loadFixture(
        deployZodaxFixture
      );

      await token
        .connect(owner)
        .approve(buyer.address, ethers.parseEther("1000"));
      await expect(
        token
          .connect(buyer)
          .transferFrom(
            owner.address,
            ethers.ZeroAddress,
            ethers.parseEther("1000")
          )
      ).to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { token, owner } = await loadFixture(deployZodaxFixture);

      await token.connect(owner).burn(ethers.parseEther("100"));
      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseEther("999999900")
      );
    });

    it("Should prevent burning more tokens than balance", async function () {
      const { token, buyer } = await loadFixture(deployZodaxFixture);

      await expect(
        token.connect(buyer).burn(ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow admin to withdraw tokens sent to the contract", async function () {
      const { token, defaultAdmin, anotherAccount } = await loadFixture(
        deployZodaxFixture
      );

      const TestToken = await ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy();

      await testToken.mint(token.target, ethers.parseEther("500"));
      expect(await testToken.balanceOf(token.target)).to.equal(
        ethers.parseEther("500")
      );

      await token
        .connect(defaultAdmin)
        .emergencyWithdraw(
          testToken.target,
          anotherAccount.address,
          ethers.parseEther("500")
        );

      expect(await testToken.balanceOf(anotherAccount.address)).to.equal(
        ethers.parseEther("500")
      );
    });

    it("Should prevent non-admin from calling emergencyWithdraw", async function () {
      const { token, buyer } = await loadFixture(deployZodaxFixture);

      const TestToken = await ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy();

      await testToken.mint(token.target, ethers.parseEther("500"));

      await expect(
        token
          .connect(buyer)
          .emergencyWithdraw(
            testToken.target,
            buyer.address,
            ethers.parseEther("500")
          )
      ).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should prevent emergencyWithdraw if token address is zero address", async function () {
      const { token, defaultAdmin, anotherAccount } = await loadFixture(
        deployZodaxFixture
      );

      await expect(
        token
          .connect(defaultAdmin)
          .emergencyWithdraw(
            ethers.ZeroAddress,
            anotherAccount.address,
            ethers.parseEther("500")
          )
      ).to.be.revertedWith("Invalid token");
    });

    it("Should prevent emergencyWithdraw if recipient address is zero address", async function () {
      const { token, defaultAdmin } = await loadFixture(deployZodaxFixture);

      const TestToken = await ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy();

      await testToken.mint(token.target, ethers.parseEther("500"));

      await expect(
        token
          .connect(defaultAdmin)
          .emergencyWithdraw(testToken.target, ethers.ZeroAddress, 1000)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should revert if emergencyWithdraw amount exceeds balance", async function () {
      const { token, defaultAdmin, anotherAccount } = await loadFixture(
        deployZodaxFixture
      );

      const TestToken = await ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy();

      await testToken.mint(token.target, ethers.parseEther("500"));

      await expect(
        token
          .connect(defaultAdmin)
          .emergencyWithdraw(
            testToken.target,
            anotherAccount.address,
            ethers.parseEther("1000")
          )
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should prevent emergencyWithdraw if amount is zero", async function () {
      const { token, defaultAdmin, anotherAccount } = await loadFixture(
        deployZodaxFixture
      );

      const TestToken = await ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy();

      await testToken.mint(token.target, ethers.parseEther("500"));

      await expect(
        token
          .connect(defaultAdmin)
          .emergencyWithdraw(testToken.target, anotherAccount.address, 0)
      ).to.be.revertedWith("Invalid amount");
    });
  });

  describe("Access Control", function () {
    it("Should allow default admin to assign roles", async function () {
      const { token, defaultAdmin, buyer } = await loadFixture(
        deployZodaxFixture
      );

      const defaultAdminRole = await token.DEFAULT_ADMIN_ROLE();
      expect(
        await token
          .connect(defaultAdmin)
          .grantRole(defaultAdminRole, buyer.address)
      ).to.be.ok;
    });

    it("Should prevent non-admin from assigning roles", async function () {
      const { token, buyer } = await loadFixture(deployZodaxFixture);

      const defaultAdminRole = await token.DEFAULT_ADMIN_ROLE();
      await expect(
        token.connect(buyer).grantRole(defaultAdminRole, buyer.address)
      ).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("ERC20 Permit", function () {
    it("Should allow permit-based approvals", async function () {
      const { token, owner, buyer, anotherAccount } = await loadFixture(
        deployZodaxFixture
      );

      const nonce = await token.nonces(buyer.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await buyer.provider
          .getNetwork()
          .then((network) => network.chainId),
        verifyingContract: token.target,
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

      const value = ethers.parseEther("100");

      const signature = await buyer.signTypedData(domain, types, {
        owner: buyer.address,
        spender: anotherAccount.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      });

      const Signature = ethers.Signature.from(signature);

      const v = Signature.v;
      const r = Signature.r;
      const s = Signature.s;

      await token.permit(
        buyer.address,
        anotherAccount.address,
        value,
        deadline,
        v,
        r,
        s
      );

      expect(
        await token.allowance(buyer.address, anotherAccount.address)
      ).to.equal(value);
    });

    it("Should prevent replay attacks", async function () {
      const { token, anotherAccount, buyer } = await loadFixture(
        deployZodaxFixture
      );

      const nonce = await token.nonces(buyer.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await buyer.provider
          .getNetwork()
          .then((network) => network.chainId),
        verifyingContract: token.target,
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

      const value = ethers.parseEther("100");

      const signature = await buyer.signTypedData(domain, types, {
        owner: buyer.address,
        spender: anotherAccount.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      });

      const Signature = ethers.Signature.from(signature);

      const v = Signature.v;
      const r = Signature.r;
      const s = Signature.s;

      await token.permit(
        buyer.address,
        anotherAccount.address,
        value,
        deadline,
        v,
        r,
        s
      );

      // it should revert if the same signature is used again

      await expect(
        token.permit(
          buyer.address,
          anotherAccount.address,
          value,
          deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(token, "ERC2612InvalidSigner");
    });

    it("Should prevent approvals after deadline", async function () {
      const { token, anotherAccount, buyer } = await loadFixture(
        deployZodaxFixture
      );

      const nonce = await token.nonces(buyer.address);
      const deadline = Math.floor(Date.now() / 1000); // 1 second ago

      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await buyer.provider
          .getNetwork()
          .then((network) => network.chainId),
        verifyingContract: token.target,
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

      const value = ethers.parseEther("100");

      const signature = await buyer.signTypedData(domain, types, {
        owner: buyer.address,
        spender: anotherAccount.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      });

      const Signature = ethers.Signature.from(signature);

      const v = Signature.v;
      const r = Signature.r;
      const s = Signature.s;

      await time.increase(4000);

      await expect(
        token.permit(
          buyer.address,
          anotherAccount.address,
          value,
          deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(token, "ERC2612ExpiredSignature");
    });

    it("Should prevent approvals with invalid signatures", async function () {
      const { token, anotherAccount, buyer, owner } = await loadFixture(
        deployZodaxFixture
      );

      const nonce = await token.nonces(buyer.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await buyer.provider
          .getNetwork()
          .then((network) => network.chainId),
        verifyingContract: token.target,
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

      const value = ethers.parseEther("100");

      const signature = await owner.signTypedData(domain, types, {
        owner: buyer.address,
        spender: anotherAccount.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      });

      const Signature = ethers.Signature.from(signature);

      const v = Signature.v;
      const r = Signature.r;
      const s = Signature.s;

      await expect(
        token.permit(
          buyer.address,
          anotherAccount.address,
          value,
          deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(token, "ERC2612InvalidSigner");
    });
  });
});
