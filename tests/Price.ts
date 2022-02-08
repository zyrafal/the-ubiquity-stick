import type { FeeData, TransactionReceipt } from "@ethersproject/abstract-provider";
import type { Price } from "../types/Price";

import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { Signer, Contract, BigNumber } from "ethers";

describe.only("Price", function () {
  let signer: Signer;
  let signerAddress: string;
  let price: Price;

  before(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();
    console.log("signer", signerAddress, "\n");

    // Deploy contract if not already
    if (!(await ethers.getContractOrNull("Price"))) {
      console.log("Deploy Price...");
      await deployments.fixture(["Price"]);
    }

    price = await ethers.getContract("Price", signer);
    console.log("contract", price.address, "\n");
  });

  afterEach(async () => {});

  it("Should be ok", async function () {
    expect(signerAddress).to.be.properAddress;
    expect(price.address).to.be.properAddress;
  });

  it("Should get Price", async function () {
    const prix = await price.getLatestPrice();
    console.log("price", ethers.utils.formatUnits(prix, 8));
  });
});
