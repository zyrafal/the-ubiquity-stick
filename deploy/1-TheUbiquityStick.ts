import type { DeployFunction } from "hardhat-deploy/types";
import type { TheUbiquityStick } from "../artifacts/types/TheUbiquityStick";
import tokenURIs from "../metadata/json.json";

const deployUbiquiStickNFT: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const deployer = await ethers.getNamedSigner("deployer");
  const ten = ethers.BigNumber.from("10");
  const gwei = ten.pow(9);

  const deployResult = await deploy("TheUbiquityStick", {
    from: deployer.address,
    args: [],
    log: true,
    // type: 2,
    // gasLimit: BigNumber.from("1000000"),
    // gasPrice: BigNumber.from("1000000000")
    // maxFeePerGas: gwei.mul(10),
    // maxPriorityFeePerGas: gwei.mul(10)
  });
  if (deployResult.newlyDeployed) {
    const theUbiquityStick = new ethers.Contract(deployResult.address, deployResult.abi, deployer) as TheUbiquityStick;
    await theUbiquityStick.connect(deployer).setTokenURI(0, tokenURIs.standardJson);
    await theUbiquityStick.connect(deployer).setTokenURI(1, tokenURIs.goldJson);
    await theUbiquityStick.connect(deployer).setTokenURI(2, tokenURIs.invisibleJson);
  }

};
export default deployUbiquiStickNFT;

deployUbiquiStickNFT.tags = ["UbiquiStickNFT"];
