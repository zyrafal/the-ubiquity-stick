import type { DeployFunction } from "hardhat-deploy/types";

const deployTheUbiquiStickSale: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deployer } = await ethers.getNamedSigners();
  const { treasury } = await getNamedAccounts();

  const deployResult = await deployments.deploy("TheUbiquiStickSale", {
    from: deployer.address,
    args: [],
    log: true
  });
  if (deployResult.newlyDeployed) {
    const theUbiquiStick = await ethers.getContract("TheUbiquityStick");
    await theUbiquiStick.connect(deployer).setMinter(deployResult.address);

    const theUbiquiStickSale = new ethers.Contract(deployResult.address, deployResult.abi, deployer);
    await theUbiquiStickSale.connect(deployer).setFundsAddress(treasury);
    await theUbiquiStickSale.connect(deployer).setTokenContract(theUbiquiStick?.address);
  }

};
export default deployTheUbiquiStickSale;

deployTheUbiquiStickSale.tags = ["TheUbiquiStickSale"];
deployTheUbiquiStickSale.dependencies = ["TheUbiquityStick"];