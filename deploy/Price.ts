import type { HardhatRuntimeEnvironment } from "hardhat/types";

const deployPrice = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  let pairs: string[] = [];
  let addresses: string[] = [];

  if (network.name == "mainnet") {
    pairs = ["ETH/USD", "DAI/USD", "USDC/USD", "USDT/USD", "LUSD/USD", "FEI/USD", "MIM/USD"];
    addresses = [
      "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
      "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
      "0x3D7aE7E594f2f2091Ad8798313450130d0Aba3a0",
      "0x31e0a88fecB6eC0a411DBe0e9E76391498296EE9",
      "0x7A364e8770418566e3eb2001A96116E6138Eb32F"
    ];
  } else if (network.name == "kovan") {
    pairs = ["ETH/USD", "DAI/USD", "USDC/USD"];
    addresses = [
      "0x9326BFA02ADD2366b30bacB125260Af641031331",
      "0x777A68032a88E5A84678A77Af2CD65A7b3c0775a",
      "0x9211c6b3BF41A10F78539810Cf5c64e1BB78Ec60"
    ];
  } else if (network.name == "rinkeby") {
    pairs = ["ETH/USD", "DAI/USD", "USDC/USD"];
    addresses = [
      "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
      "0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF",
      "0xa24de01df22b63d23Ebc1882a5E3d4ec0d907bFB"
    ];
  }

  const deployResult = await deploy("Price", {
    from: deployer,
    args: [pairs, addresses],
    log: true
  });

  if (deployResult.newlyDeployed) {
    console.log("Price newly deployed");
  }
};
deployPrice.tags = ["Price"];

export default deployPrice;
