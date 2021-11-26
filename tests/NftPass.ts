import { expect } from "chai";
import { ethers, deployments, getNamedAccounts, network, getUnnamedAccounts } from "hardhat";
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

describe("NftPass", function () {
  let minterSigner: Signer;
  let tester1Signer: Signer;
  let nftPass: NftPass;
  let tester1: string;
  let tester2: string;
  let random: string;
  const minter = "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd";

  before(async () => {
    ({ tester1, tester2, random } = await getNamedAccounts());

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [minter]
    });
    minterSigner = ethers.provider.getSigner(minter);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [tester1]
    });
    tester1Signer = ethers.provider.getSigner(tester1);

    // DEPLOY NFTPass contract if not already
    if (!(await ethers.getContractOrNull("NftPass"))) {
      console.log("Deploy NftPass...");
      await deployments.fixture(["NftPass"]);
    }

    // GET NFTPass contract
    nftPass = await ethers.getContract("NftPass", minterSigner);
    console.log("contract", nftPass.address, "\n");

    // MINT 2 NFTs
    await nftPass.safeMint(tester1);
    await nftPass.safeMint(tester2);
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
    expect(await nftPass.tokenURI(0)).to.be.equal(await nftPass.tokenURI(1));
  });

  it("Check balanceOf", async function () {
    expect(await nftPass.balanceOf(tester1)).to.be.equal(1);
    expect(await nftPass.balanceOf(tester2)).to.be.equal(1);
    expect(await nftPass.balanceOf(random)).to.be.equal(0);
  });

  it("Check ownerOf", async function () {
    expect(await nftPass.ownerOf(0)).to.be.equal(tester1);
    expect(await nftPass.ownerOf(1)).to.be.equal(tester2);
    await expect(nftPass.ownerOf(2)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("Check mint", async function () {
    await expect(nftPass.connect(minterSigner).safeMint(tester1)).to.be.not.reverted;
    await expect(nftPass.connect(tester1Signer).safeMint(tester1)).to.be.reverted;
  });

  it("Check burn", async function () {
    await expect(nftPass.connect(tester1Signer).burn(0)).to.be.not.reverted;
    await expect(nftPass.burn(0)).to.be.revertedWith("'ERC721: operator query for nonexistent token");
    await expect(nftPass.burn(10)).to.be.revertedWith("'ERC721: operator query for nonexistent token");
    await expect(nftPass.burn(1)).to.be.revertedWith("ERC721Burnable: caller is not owner nor approved");
  });

  it("Check setTokenURI", async function () {
    await expect(nftPass.connect(minterSigner).setTokenURI("newUri")).to.be.not.reverted;
    expect(await nftPass.tokenURI(1)).to.be.equal("newUri");
    await expect(nftPass.connect(tester1Signer).setTokenURI("newUri")).to.be.reverted;
  });
});
