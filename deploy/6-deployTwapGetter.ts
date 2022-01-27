import type { DeployFunction } from "hardhat-deploy/types";

import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployTwapGetter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const deployResult = await deploy("TwapGetter", {
    from: deployer,
    args: [],
    log: true
  });
  if (deployResult.newlyDeployed) {
    console.log("New TwapGetter deployment");
  }
};
deployTwapGetter.tags = ["TwapGetter"];
deployTwapGetter.skip = async ({ network }) => network.name === "mainnet";

export default deployTwapGetter;
