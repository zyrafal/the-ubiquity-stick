import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ getChainId, deployments, getNamedAccounts }) {
  const managerAddressMap = new Map([
    ["1", "0x4DA97a8b831C345dBe6d16FF7432DF2b7b776d98"],
    ["4", "0x83ff5d827C454CBe516Dd75bd770D0311fAA8539"]
  ]);
  const chainId = await getChainId();
  const managerAddress = managerAddressMap.get(chainId);
  // console.log("chainId managerAddress", chainId, managerAddress);

  if (managerAddress) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("NftPass", {
      from: deployer,
      args: [managerAddress],
      log: true
    });
  } else {
    deployments.log("No UBQ Manager on this network");
  }
};
export default func;

func.tags = ["NftPass"];
