import { expect } from "chai";
import { ethers, deployments, getNamedAccounts } from "hardhat";
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
// - allow owner with UBQ minter role to transfer it’s ownership of the contract

describe("NftPass", function () {
  let signer: Signer;
  let signerAddress: string;
  let nftPass: NftPass;

  before(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();
    console.log("signer", signerAddress, "\n");

    // DEPLOY NFTPass contract if not already
    if (!(await ethers.getContractOrNull("NftPass"))) {
      console.log("Deploy NftPass...");
      await deployments.fixture(["NftPass"]);
    }

    // GET NFTPass contract
    nftPass = await ethers.getContract("NftPass", signer);
    console.log("contract", nftPass.address, "\n");

    // MINT 2 NFTs
    const { tester1, tester2 } = await getNamedAccounts();
    console.log("tester1", tester1);
    await nftPass.safeMint(tester1);
    await nftPass.safeMint(tester2);
  });

  afterEach(async () => {});

  it("Should be ok", async function () {
    expect(signerAddress).to.be.properAddress;
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
    await nftPass.tokenURI(0);
    // expect(await nftPass.tokenURI(0)).to.be.equal(await nftPass.tokenURI(1));
  });
});
