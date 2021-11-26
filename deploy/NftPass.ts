import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const managerAddress = new Map([["1", "0x4DA97a8b831C345dBe6d16FF7432DF2b7b776d98"]]);

  const chainId = await hre.getChainId();
  console.log("chainId", chainId);

  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("NftPass", {
    from: deployer,
    args: [managerAddress.get(chainId)],
    log: true
  });
};
export default func;

func.tags = ["NftPass"];
