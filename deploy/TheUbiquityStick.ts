import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ getChainId, deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("TheUbiquityStick", {
    from: deployer,
    args: [],
    log: true
  });
};
export default func;

func.tags = ["TheUbiquityStick"];
