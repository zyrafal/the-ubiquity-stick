#! ts-node

import type { Response } from "node-fetch";
import fetch from "node-fetch";
import { ethers, BigNumber, FixedNumber } from "ethers";

const deuce = BigNumber.from(2);
const ten = BigNumber.from(10);
const bigOne = ten.pow(18);
// 0xae666F497e3b03415503785df36f795e6D91d4b3
// 0xa6c49fd13e50a30c65e6c8480aada132011d0613
const api = "https://api.thegraph.com/subgraphs/name/gelatodigital/g-uni";
const gql = `
{
  pools(where: {address: "0xa6c49fd13e50a30c65e6c8480aada132011d0613"}) {
    id
    name
    blockCreated
    manager
    address
    uniswapPool
    token0 {
      address
      name
      symbol
      decimals
    }
    token1 {
      address
      name
      symbol
      decimals
    }
    feeTier
    liquidity
    lowerTick
    upperTick
    totalSupply
    positionId
    latestInfo {
      sqrtPriceX96
      reserves0
      reserves1
      leftover0
      leftover1
      unclaimedFees0
      unclaimedFees1
      block
    }
  }
}

`;

const runQuery = async (url: string, query: Object): Promise<string> => {
  const res: Response = await fetch(url, { method: "POST", body: JSON.stringify({ query }) });
  return await res.json();
};

runQuery(api, gql)
  .then((res: any) => {
    const pool0 = res.data.pools[0];
    console.log(JSON.stringify(pool0, null, "  "));

    const dec0 = Number(pool0.token0.decimals);
    console.log("dec0", dec0);
    const dec1 = Number(pool0.token1.decimals);
    console.log("dec1", dec1);

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
  })
  .catch(console.error);
