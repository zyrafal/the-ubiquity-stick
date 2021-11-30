import { expect } from "chai";
import { ethers, deployments, getNamedAccounts, network, getChainId } from "hardhat";
import { Signer } from "ethers";
import { TheUbiquityStick } from "../artifacts/types/TheUbiquityStick";
import json from "../metadata/json.json";

// With "The UbiquiStick" NFT contract you can :
// - get all ERC721 functionnality https://eips.ethereum.org/EIPS/eip-721
//   - including optional ERC721Metadata
//     but without metadata JSON schema
//     2 types of NFTs : standard and gold, each one having same metadata
//     2 different tokenURIs :  tokenURI or tokenGOldURI
//   - excluding optional ERC721Enumerable
//     but NFT tokenID increments starting from 0, so easy to enumerate
//   - including check that someone as a NFT of the collection with « balanceOf »
//   - including check who is TokenID owner with « ownerOf »
// - get you NFT listed on OpenSea (on mainnet or matic only)
// - allow NFT owner to burn it’s own NFT
// - allow owner with UBQ minter role to change tokenURI or tokenGoldURI
// - allow owner with UBQ minter role to mint NFT

describe("TheUbiquityStick", function () {
  const standardJson = json["standard.json"];
  const goldJson = json["gold.json"];
  const invisibleJson = json["invisible.json"];

  let minterSigner: Signer;
  let tester1Signer: Signer;
  let theUbiquityStick: TheUbiquityStick;
  let tokenIdStart: number;

  let minter: string;
  let tester1: string;
  let tester2: string;
  let random: string;
  // const minter = "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd";

  before(async () => {
    const chainId = Number(await getChainId());
    console.log("network", chainId, network.name, network.live);

    const namedAccounts = await getNamedAccounts();
    ({ minter, tester1, tester2, random } = namedAccounts);
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
    if (!(await ethers.getContractOrNull("TheUbiquityStick"))) {
      console.log("Deploy TheUbiquityStick...");
      await deployments.fixture(["TheUbiquityStick"]);
    }

    // GET NFTPass contract
    theUbiquityStick = await ethers.getContract("TheUbiquityStick", minterSigner);
    console.log("contract", theUbiquityStick.address);

    tokenIdStart = Number(await theUbiquityStick.tokenIdNext());
    console.log("tokenIdStart", tokenIdStart);
  });

  it("Check contract ok", async function () {
    expect(theUbiquityStick.address).to.be.properAddress;
  });

  it("Check with ERC165 that theUbiquityStick is ERC721, ERC721Metadata compatible and not ERC721Enumerable, ERC721TokenReceiver", async function () {
    const ERC721 = "0x80ac58cd";
    const ERC721TokenReceiver = "0x150b7a02";
    const ERC721Metadata = "0x5b5e139f";
    const ERC721Enumerable = "0x780e9d63";

    expect(await theUbiquityStick.supportsInterface(ERC721)).to.be.true;
    expect(await theUbiquityStick.supportsInterface(ERC721Metadata)).to.be.true;
    expect(await theUbiquityStick.supportsInterface(ERC721TokenReceiver)).to.be.false;
    expect(await theUbiquityStick.supportsInterface(ERC721Enumerable)).to.be.false;
  });

  it("Check mint", async function () {
    // 1 NFT for tester 2 and 2 NFTs for tester1 , second one will be burn
    await expect((await theUbiquityStick.connect(minterSigner).safeMint(tester1)).wait()).to.be.not.reverted;
    await expect((await theUbiquityStick.connect(minterSigner).safeMint(tester2)).wait()).to.be.not.reverted;
    await expect((await theUbiquityStick.connect(minterSigner).safeMint(tester1)).wait()).to.be.not.reverted;
    await expect(theUbiquityStick.connect(tester1Signer).safeMint(tester1)).to.be.reverted;
  });

  it("Check balanceOf", async function () {
    expect(await theUbiquityStick.balanceOf(tester1)).to.be.gte(2);
    expect(await theUbiquityStick.balanceOf(tester2)).to.be.gte(1);
    expect(await theUbiquityStick.balanceOf(random)).to.be.equal(0);
  });

  it("Check ownerOf", async function () {
    expect(await theUbiquityStick.ownerOf(tokenIdStart)).to.be.equal(tester1);
    expect(await theUbiquityStick.ownerOf(tokenIdStart + 1)).to.be.equal(tester2);
    expect(await theUbiquityStick.ownerOf(tokenIdStart + 2)).to.be.equal(tester1);
    await expect(theUbiquityStick.ownerOf(0)).to.be.revertedWith("ERC721: owner query for nonexistent token");
    await expect(theUbiquityStick.ownerOf(1)).to.be.not.reverted;
    await expect(theUbiquityStick.ownerOf(999)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("Check burn", async function () {
    await expect((await theUbiquityStick.connect(tester1Signer).burn(tokenIdStart + 2)).wait()).to.be.not.reverted;
    await expect(theUbiquityStick.connect(tester1Signer).burn(tokenIdStart + 2)).to.be.revertedWith(
      "ERC721: operator query for nonexistent token"
    );
    await expect(theUbiquityStick.connect(tester1Signer).burn(tokenIdStart + 1)).to.be.revertedWith(
      "ERC721Burnable: caller is not owner nor approved"
    );
    await expect(theUbiquityStick.connect(minterSigner).burn(999)).to.be.revertedWith(
      "ERC721: operator query for nonexistent token"
    );
  });

  it("Check setTokenURI", async function () {
    await expect((await theUbiquityStick.connect(minterSigner).setTokenURI(standardJson, 0)).wait()).to.be.not.reverted;
    await expect((await theUbiquityStick.connect(minterSigner).setTokenURI(goldJson, 1)).wait()).to.be.not.reverted;
    await expect((await theUbiquityStick.connect(minterSigner).setTokenURI(invisibleJson, 2)).wait()).to.be.not
      .reverted;
    expect(await theUbiquityStick.tokenURI(tokenIdStart + 1)).to.be.oneOf([standardJson, goldJson, invisibleJson]);
    await expect(theUbiquityStick.connect(tester1Signer).setTokenURI(standardJson, 0)).to.be.reverted;
    await expect(theUbiquityStick.connect(tester1Signer).setTokenURI(standardJson, 1)).to.be.reverted;
  });

  it("Check randomness 1 out of 64, about 1.5%", async function () {
    let nn = network.name === "hardhat" ? 1024 : network.name === "rinkeby" ? 16 : network.name === "matic" ? 1 : 0;

    if (nn) {
      const tokenIdMin = Number(await theUbiquityStick.tokenIdNext());
      for (let i = tokenIdMin; i < tokenIdMin + nn; i++) {
        await (await theUbiquityStick.connect(minterSigner).safeMint(tester1)).wait();
      }
      expect(await theUbiquityStick.balanceOf(tester1)).to.be.gte(nn);

      const tokenIdMax = Number(await theUbiquityStick.tokenIdNext());
      expect(tokenIdMax).to.be.equal(tokenIdMin + nn);
      console.log("nTotal", nn);

      let nGold = 0;
      let goldies = "";
      for (let i = tokenIdMin; i < tokenIdMax; i++)
        if (await theUbiquityStick.gold(i)) {
          goldies += ` ${i}`;
          nGold++;
        }
      console.log("nGold", nGold, goldies);

      const ratio = (100 * nGold) / nn;
      console.log("ratio ", ratio, "%");
      expect(ratio).to.be.gt(1).and.to.be.lt(3);
    }
  });
});
