import type { DeployFunction } from "hardhat-deploy/types";
import type {TheUbiquityStick} from "../artifacts/types/TheUbiquityStick";
import  tokenURIs from "../metadata/json.json";

const func: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const deployer = await ethers.getNamedSigner("deployer");

  const deployResult = await deploy("TheUbiquityStick", {
    from: deployer.address,
    args: [],
    log: true
  });
  if (deployResult.newlyDeployed) {
    const theUbiquityStick = new ethers.Contract(deployResult.address, deployResult.abi, deployer) as TheUbiquityStick;
    await theUbiquityStick.connect(deployer).setTokenURI(0,tokenURIs.standardJson);
    await theUbiquityStick.connect(deployer).setTokenURI(1,tokenURIs.goldJson);
    await theUbiquityStick.connect(deployer).setTokenURI(2,tokenURIs.invisibleJson);
  }

};
export default func;

func.tags = ["TheUbiquityStick"];
