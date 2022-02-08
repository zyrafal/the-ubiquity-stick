#! ts-node

import type { Response } from "node-fetch";
import fetch from "node-fetch";
import fs from "fs";
import { ethers, BigNumber, FixedNumber } from "ethers";

const deuce = BigNumber.from(2);
const ten = BigNumber.from(10);
const bigOne = ten.pow(18);

const POOL_GET_WETH = "0xae666F497e3b03415503785df36f795e6D91d4b3"; // Gelato Uniswap GEL/WETH LP
const POOL_USDC_WETH = "0xa6c49fd13e50a30c65e6c8480aada132011d0613"; // Gelato Uniswap USDC/WETH LP

const api = "https://api.thegraph.com/subgraphs/name/gelatodigital/g-uni";
const query = fs.readFileSync("pools.gql", "utf8");

const runQuery = async (poolAddress: string): Promise<any> => {
  const body = JSON.stringify({ query, variables: { address: poolAddress.toLowerCase() } });
  const res: Response = await fetch(api, { method: "POST", body });
  return await res.json();
};

const priceQuery = async (poolAddress: string) => {
  const res: any = await runQuery(poolAddress);

  const pool0 = res.data.pools[0];
  // console.log(JSON.stringify(pool0, null, "  "));

  const dec0 = Number(pool0.token0.decimals);
  const name0 = pool0.token0.name;
  console.log(name0, dec0);
  const dec1 = Number(pool0.token1.decimals);
  const name1 = pool0.token1.name;
  console.log(name1, dec1);

  const sqrtPriceX96 = BigNumber.from(pool0.latestInfo.sqrtPriceX96);
  console.log("sqrtPriceX96", sqrtPriceX96.toString());

  const priceX96 = sqrtPriceX96.pow(2);
  console.log("priceX96", priceX96.toString());

  const deux192 = deuce.pow(192);
  console.log("deux192", deux192.toString());

  const price = priceX96.div(deux192);
  console.log("price", price.toString());

  const priceToken0 = ten.pow(dec0).mul(priceX96).div(deux192);
  console.log("priceToken0", priceToken0.toString());
  console.log("priceToken0", ethers.utils.formatEther(priceToken0));

  const priceToken1 = ten
    .pow(2 * dec1 - dec0)
    .mul(deux192)
    .div(priceX96);
  console.log("priceToken1", priceToken1.toString());
  console.log("priceToken1", ethers.utils.formatEther(priceToken1));

  console.log("-");
};

const main = async () => {
  await priceQuery(POOL_GET_WETH);
  await priceQuery(POOL_USDC_WETH);
};

main().catch(console.error);
