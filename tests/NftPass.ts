import { expect } from "chai";
import { ethers, deployments, getNamedAccounts, network, getChainId } from "hardhat";
import { Signer } from "ethers";
import { NftPass } from "../artifacts/types/NftPass";

// With "The UbiquiStick" NFT contract you can :
// - get all ERC721 functionnality https://eips.ethereum.org/EIPS/eip-721
//   - including optional ERC721Metadata
//     but without metadata JSON schema
//     all NFTs having same metadata (uniq tokenURI)
//   - excluding optional ERC721Enumerable
//     but NFT tokenID increments starting from 0, so easy to enumerate
//   - including check that someone as a NFT of the collection with « balanceOf »
//   - including check who is TokenID owner with « ownerOf »
// - get you NFT listed on OpenSea (on mainnet or matic only)
// - allow NFT owner to burn it’s own NFT
// - allow owner with UBQ minter role to change tokenURI (used for all NFTs)
// - allow owner with UBQ minter role to mint NFT

// Add Gold ones

describe("NftPass", function () {
  let minterSigner: Signer;
  let tester1Signer: Signer;
  let nftPass: NftPass;
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
    if (!(await ethers.getContractOrNull("NftPass"))) {
      console.log("Deploy NftPass...");
      await deployments.fixture(["NftPass"]);
    }

    // GET NFTPass contract
    nftPass = await ethers.getContract("NftPass", minterSigner);
    console.log("contract", nftPass.address);

    tokenIdStart = Number(await nftPass.tokenIdNext());
    console.log("tokenIdStart", tokenIdStart);

    // MINT 2 NFTs
    await (await nftPass.connect(minterSigner).safeMint(tester1)).wait();
    await (await nftPass.connect(minterSigner).safeMint(tester2)).wait();
  });

  it("Should be ok", async function () {
    expect(nftPass.address).to.be.properAddress;
  });

  it("Check with ERC165 that nftPass is ERC721, ERC721Metadata compatible and not ERC721Enumerable, ERC721TokenReceiver", async function () {
    const ERC721 = "0x80ac58cd";
    const ERC721TokenReceiver = "0x150b7a02";
    const ERC721Metadata = "0x5b5e139f";
    const ERC721Enumerable = "0x780e9d63";

    expect(await nftPass.supportsInterface(ERC721)).to.be.true;
    expect(await nftPass.supportsInterface(ERC721Metadata)).to.be.true;
    expect(await nftPass.supportsInterface(ERC721TokenReceiver)).to.be.false;
    expect(await nftPass.supportsInterface(ERC721Enumerable)).to.be.false;
  });

  it("Check that tokenURI is uniq", async function () {
    const tokenURI0 = await nftPass.tokenURI(tokenIdStart);
    const tokenURI1 = await nftPass.tokenURI(tokenIdStart + 1);
    expect(tokenURI0).to.be.equal(tokenURI1);
  });

  it("Check balanceOf", async function () {
    expect(await nftPass.balanceOf(tester1)).to.be.gte(1);
    expect(await nftPass.balanceOf(tester2)).to.be.gte(1);
    expect(await nftPass.balanceOf(random)).to.be.equal(0);
  });

  it("Check ownerOf", async function () {
    expect(await nftPass.ownerOf(tokenIdStart)).to.be.equal(tester1);
    expect(await nftPass.ownerOf(tokenIdStart + 1)).to.be.equal(tester2);
    await expect(nftPass.ownerOf(999)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("Check mint", async function () {
    await expect(nftPass.connect(minterSigner).safeMint(tester1)).to.be.not.reverted;
    await expect(nftPass.connect(tester1Signer).safeMint(tester1)).to.be.reverted;
  });

  it("Check burn", async function () {
    await expect(nftPass.connect(tester1Signer).burn(tokenIdStart)).to.be.not.reverted;
    await expect(nftPass.connect(tester1Signer).burn(tokenIdStart + 1)).to.be.revertedWith(
      "ERC721Burnable: caller is not owner nor approved"
    );
    await expect(nftPass.connect(minterSigner).burn(999)).to.be.revertedWith(
      "ERC721: operator query for nonexistent token"
    );
  });

  it("Check setTokenURI and setTokenGoldURI", async function () {
    await expect((await nftPass.connect(minterSigner).setTokenURI("newUri")).wait()).to.be.not.reverted;
    await expect((await nftPass.connect(minterSigner).setTokenGoldURI("newGoldUri")).wait()).to.be.not.reverted;
    expect(await nftPass.tokenURI(tokenIdStart + 1)).to.be.oneOf(["newUri", "newGoldUri"]);
    await expect(nftPass.connect(tester1Signer).setTokenURI("newUri")).to.be.reverted;
    await expect(nftPass.connect(tester1Signer).setTokenGoldURI("newUri")).to.be.reverted;
  });

  if (network.name === "hardhat") {
    it("Check randomness 1 out of 64, about 1.5%", async function () {
      const nn = 1000;

      const tokenIdMin = Number(await nftPass.tokenIdNext());
      for (let i = tokenIdMin; i < tokenIdMin + nn; i++) {
        await (await nftPass.connect(minterSigner).safeMint(tester1)).wait();
      }
      expect(await nftPass.balanceOf(tester1)).to.be.gte(nn);

      const tokenIdMax = Number(await nftPass.tokenIdNext());
      expect(tokenIdMax).to.be.equal(tokenIdMin + nn);
      console.log("nTotal", nn);

      let nGold = 0;
      for (let i = tokenIdMin; i < tokenIdMax; i++) (await nftPass.gold(i)) && nGold++;
      console.log("nGold ", nGold);

      const ratio = (100 * nGold) / nn;
      console.log("ratio ", ratio, "%");
      expect(ratio).to.be.gt(1).and.to.be.lt(3);
    });
  }
});
