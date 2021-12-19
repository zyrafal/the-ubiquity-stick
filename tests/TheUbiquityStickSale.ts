import { expect } from "chai";
import { ethers, deployments, getNamedAccounts, network, getChainId } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { TheUbiquityStick } from "../artifacts/types/TheUbiquityStick";
import { TheUbiquityStickSale } from "../artifacts/types/TheUbiquityStickSale";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const MAXIMUM_SUPPLY = 1024;
const one = BigNumber.from(10).pow(18);
const count = 42;

describe("TheUbiquityStickSale", function () {

  let minterSigner: Signer;
  let tester1Signer: Signer;
  let theUbiquityStick: TheUbiquityStick;
  let theUbiquityStickSale: TheUbiquityStickSale;
  let tokenIdStart: number;

  let minter: string;
  let tester1: string;
  let tester2: string;
  let random: string;
  let treasury: string;


  before(async () => {
    const chainId = Number(await getChainId());
    console.log("network", chainId, network.name, network.live);

    const namedAccounts = await getNamedAccounts();
    ({ minter, tester1, tester2, random, treasury } = namedAccounts);
    console.log("NamedAccounts", namedAccounts);

    if (network.name === "hardhat") {
      console.log("impersonating minter and tester1");
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [minter]
      });
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [tester1]
      });
    }
    minterSigner = ethers.provider.getSigner(minter);
    tester1Signer = ethers.provider.getSigner(tester1);

    // DEPLOY NFTPass contract if not already
    if (!(await ethers.getContractOrNull("TheUbiquityStickSale"))) {
      console.log("Deploy TheUbiquityStickSale...");
      await deployments.fixture(["TheUbiquityStickSale"]);
    }


    theUbiquityStickSale = await ethers.getContract("TheUbiquityStickSale", minterSigner);
    console.log("contract", theUbiquityStickSale.address);

    theUbiquityStick = await ethers.getContract("TheUbiquityStick", minterSigner);
    console.log("contract", theUbiquityStick.address);

  });

  it("Check contract ok", async function () {
    expect(theUbiquityStickSale.address).to.be.properAddress;
    expect(await theUbiquityStickSale.owner()).to.be.properAddress;
  });

  describe("TheUbiquityStickSale view functions", function () {
    it("Check MAXIMUM_SUPPLY", async function () {
      expect(await theUbiquityStickSale.MAXIMUM_SUPPLY()).to.be.equal(MAXIMUM_SUPPLY);
    });
    it("Check tokenContract", async function () {
      expect(await theUbiquityStickSale.tokenContract()).to.be.equal(theUbiquityStick.address);
    });
    it("Check fundsAddress", async function () {
      expect(await theUbiquityStickSale.fundsAddress()).to.be.equal(treasury);
    });
    it("Check allowance", async function () {
      const allow = await theUbiquityStickSale.allowance(random);
      expect(allow.count).to.be.equal(0);
      expect(allow.price).to.be.equal(0);
    });
    it("Check owner", async function () {
      expect(await theUbiquityStickSale.owner()).to.be.equal(minter);
    });
  });

  describe("TheUbiquityStickSale set functions", function () {
    it("Check setTokenContract", async function () {
      await (await theUbiquityStickSale.setTokenContract(random)).wait();
      expect(await theUbiquityStickSale.tokenContract()).to.be.equal(random);
    });
    it("Check setFundsAddress", async function () {
      await (await theUbiquityStickSale.setFundsAddress(random)).wait();
      expect(await theUbiquityStickSale.fundsAddress()).to.be.equal(random);
    });
    it("Check setAllowance", async function () {
      await (await theUbiquityStickSale.setAllowance(random, count, one)).wait();
      const allow = await theUbiquityStickSale.allowance(random);
      expect(allow.count).to.be.equal(count);
      expect(allow.price).to.be.equal(one);
    });
    it("Check batchSetAllowances", async function () {
      await (await theUbiquityStickSale.batchSetAllowances(
        [tester1, tester2],
        [count, count * 2,],
        [one, one.mul(3)])
      ).wait();
      const allow1 = await theUbiquityStickSale.allowance(tester1);
      expect(allow1.count).to.be.equal(count);
      expect(allow1.price).to.be.equal(one);
      const allow2 = await theUbiquityStickSale.allowance(tester2);
      expect(allow2.count).to.be.equal(count * 2);
      expect(allow2.price).to.be.equal(one.mul(3));
    });
  });


  describe("TheUbiquityStickSale modifiers", function () {
    it("Check onlyOwner", async function () {
      await expect(theUbiquityStickSale.connect(tester1Signer)
        .setTokenContract(random)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(theUbiquityStickSale.connect(tester1Signer)
        .setFundsAddress(random)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(theUbiquityStickSale.connect(tester1Signer)
        .setAllowance(random, count, one)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(theUbiquityStickSale.connect(tester1Signer)
        .batchSetAllowances([tester1, tester2], [count, count * 2,], [one, one.mul(3)])).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Check onlyFinance", async function () {
      await expect(theUbiquityStickSale.connect(tester1Signer)
        .sendDust(random, ETH_ADDRESS, one)).to.be.revertedWith("Unauthorized Access");
    });
  });

  describe("TheUbiquityStickSale receive to Mint", function () {
    it.skip("Check receive", async function () {
      // TO DO
    });
  });

  describe("TheUbiquityStickSale send Dust", function () {
    it("Check sendDust", async function () {
      await (await theUbiquityStickSale.setFundsAddress(minter)).wait();
      await expect(theUbiquityStickSale.connect(minterSigner)
        .sendDust(random, ETH_ADDRESS, 0)).to.be.not.reverted;
    });
  });
});
