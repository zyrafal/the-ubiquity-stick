import type { DeployFunction } from "hardhat-deploy/types";

const deployUbiquiStickSale: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deployer } = await ethers.getNamedSigners();
  const { treasury } = await getNamedAccounts();

  const deployResult = await deployments.deploy("TheUbiquityStickSale", {
    from: deployer.address,
    args: [],
    log: true
  });
  if (deployResult.newlyDeployed) {
    const theUbiquityStick = await ethers.getContract("TheUbiquityStick");
    await theUbiquityStick.connect(deployer).setMinter(deployResult.address);

    const theUbiquityStickSale = new ethers.Contract(deployResult.address, deployResult.abi, deployer);
    await theUbiquityStickSale.connect(deployer).setFundsAddress(treasury);
    await theUbiquityStickSale.connect(deployer).setTokenContract(theUbiquityStick?.address);
  }

};
export default deployUbiquiStickSale;

deployUbiquiStickSale.tags = ["UbiquiStickSale"];
deployUbiquiStickSale.dependencies = ["UbiquiStickNFT"];