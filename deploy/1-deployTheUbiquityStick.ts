import type { DeployFunction } from "hardhat-deploy/types";
import type { TheUbiquityStick } from "types/TheUbiquityStick";
import tokenURIs from "../metadata/json.json";

const deployTheUbiquityStick: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const deployer = await ethers.getNamedSigner("deployer");
  console.log("deployer", deployer.address);

  const ten = ethers.BigNumber.from("10");
  const gwei = ten.pow(9);

  const deployResult = await deploy("TheUbiquityStick", {
    from: deployer.address,
    args: [],
    log: true
  });
  if (deployResult.newlyDeployed) {
    const theUbiquityStick = new ethers.Contract(deployResult.address, deployResult.abi, deployer) as TheUbiquityStick;
    await theUbiquityStick.setTokenURI(0, tokenURIs.standardJson);
    await theUbiquityStick.setTokenURI(1, tokenURIs.goldJson);
    await theUbiquityStick.setTokenURI(2, tokenURIs.invisibleJson);
  }
};
export default deployTheUbiquityStick;

deployTheUbiquityStick.tags = ["TheUbiquityStick"];
