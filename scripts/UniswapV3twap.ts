#! hh run
import { ethers, network } from "hardhat";
import { abi } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";

const uAD_USDC = "0x681B4C3aF785DacACcC496B9Ff04f9c31BcE4090";

const main = async () => {
  console.log(network.name);

  const pool = new ethers.Contract(uAD_USDC, abi, ethers.provider);
  console.log(await pool.token0());
};

main().catch(console.error);
