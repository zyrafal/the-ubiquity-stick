#! ts-node

import type { Response } from "node-fetch";
import fetch from "node-fetch";
import fs from "fs";
import { ethers, BigNumber } from "ethers";

const deuce = BigNumber.from(2);
const ten = BigNumber.from(10);
const bigOne = ten.pow(18);

const POOL_GET_WETH = "0xae666F497e3b03415503785df36f795e6D91d4b3"; // Gelato Uniswap GEL/WETH LP
const POOL_USDC_WETH = "0xa6c49fd13e50a30c65e6c8480aada132011d0613"; // Gelato Uniswap USDC/WETH LP
const POOL_UAD_USDC = "0xa9514190cbbad624c313ea387a18fd1dea576cbd"; // Gelato Uniswap uAD/USDC LP

const apiGuni = "https://api.thegraph.com/subgraphs/name/gelatodigital/g-uni";
const queryGuni = fs.readFileSync("g-uni-pools-full.gql", "utf8");
const apiUniswap = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
const queryUniswap = fs.readFileSync("uniswap-v3-pools-full.gql", "utf8");

const runQuery = async (api: string, query: string, poolAddress: string): Promise<any> => {
  const body = JSON.stringify({ query, variables: { address: poolAddress.toLowerCase() } });
  const res: Response = await fetch(api, { method: "POST", body });
  return await res.json();
};

const priceQuery = async (poolAddress: string) => {
  const resGuni: any = await runQuery(apiGuni, queryGuni, poolAddress);
  const poolGuni = resGuni.data.pools[0];
  console.log(JSON.stringify(poolGuni, null, "  "));

  const poolUniswapAddress = poolGuni.uniswapPool;
  console.log("poolUniswapAddress", poolUniswapAddress);

  const resUniswap: any = await runQuery(apiUniswap, queryUniswap, poolUniswapAddress);
  const poolUniswap = resUniswap.data.pools[0];
  console.log(JSON.stringify(poolUniswap, null, "  "));

  const dec0 = Number(poolGuni.token0.decimals);
  const name0 = poolGuni.token0.name;
  console.log(name0, dec0);
  const dec1 = Number(poolGuni.token1.decimals);
  const name1 = poolGuni.token1.name;
  console.log(name1, dec1);

  const liquidityUniswap = BigNumber.from(poolUniswap.liquidity);
  console.log("liquidityUniswap", liquidityUniswap.toString());

  const liquidityGuni = BigNumber.from(poolGuni.liquidity);
  console.log("liquidityGuni", liquidityGuni.toString());

  const liquidityRatio = liquidityUniswap.div(liquidityGuni);
  console.log("liquidityRatio", liquidityRatio.toString());

  const totalSupply = poolGuni.totalSupply;
  console.log("totalSupply", totalSupply);

  const [partInt, partDec] = (poolUniswap.totalValueLockedUSD as string).split(".");
  const totalValueLockedUSD = BigNumber.from(`${partInt}${partDec.slice(0, 18)}`);
  console.log("totalValueLockedUSD", totalValueLockedUSD.toString());

  const priceGuniLP = totalValueLockedUSD.div(liquidityRatio).div(totalSupply);
  console.log("priceGuniLP", priceGuniLP.toString());

  console.log("-");
};

const main = async () => {
  await priceQuery(POOL_USDC_WETH);
  // await priceQuery(POOL_GET_WETH);
  // await priceQuery(POOL_UAD_USDC);
};

main().catch(console.error);
