import type { DeployFunction } from "hardhat-deploy/types";
import tokenURIs from "../metadata/json.json";

const deployTheUbiquityStick: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const deployer = await ethers.getNamedSigner("deployer");
  console.log("deployer", deployer.address);

  await deploy("TheUbiquityStick", {
    from: deployer.address,
    args: [[tokenURIs.standardJson, tokenURIs.goldJson, tokenURIs.invisibleJson]],
    log: true
  });
};
export default deployTheUbiquityStick;

deployTheUbiquityStick.tags = ["TheUbiquityStick"];
