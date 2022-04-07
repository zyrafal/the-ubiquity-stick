import type { DeployFunction, Create2DeployOptions } from "hardhat-deploy/types";

const deployTheUbiquityStick: DeployFunction = async function ({ ethers, deployments }) {
  const salt = "TEST01";

  const deployDeterministic = await deployments.deterministic("TheUbiquityStick", {
    from: (await ethers.getNamedSigner("deployer")).address,
    args: [],
    log: true,
    salt: ethers.utils.hashMessage(salt)
  });
  await deployDeterministic.deploy();
};
export default deployTheUbiquityStick;

deployTheUbiquityStick.tags = ["TestDeterministic"];
deployTheUbiquityStick.skip = async ({ network }) => network.name === "mainnet";
