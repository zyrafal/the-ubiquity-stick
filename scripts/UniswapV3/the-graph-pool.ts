#! ts-node

import type { Response } from "node-fetch";
import fetch from "node-fetch";
import { ethers, BigNumber, FixedNumber } from "ethers";

const uniswapV3API = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
const gql = `{
  pools(where: {id: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"}) {
    id
    totalValueLockedUSD
    liquidity
    token0Price
    token1Price
    token0 {
      symbol
    }
    token1 {
      symbol
    }
  }
}`;

const runQuery = async (url: string, query: Object): Promise<string> => {
  const res: Response = await fetch(url, { method: "POST", body: JSON.stringify({ query }) });
  return await res.json();
};

runQuery(uniswapV3API, gql)
  .then((res: any) => {
    console.log(JSON.stringify(res, null, "  "));

    const pool0 = res.data.pools[0];
    console.log("pool0.totalValueLockedUSD", pool0.totalValueLockedUSD);
    const [partInt, partDec] = (pool0.totalValueLockedUSD as string).split(".");
    const totalValueLockedUSD = BigNumber.from(`${partInt}${partDec.slice(0, 18)}`);
    console.log("totalValueLockedUSD", ethers.utils.formatEther(totalValueLockedUSD));

    const liquidity = pool0.liquidity;
    console.log("main ~ liquidity", liquidity);

    // const lpPriceUSD = totalValueLockedUSD.div(liquidity);
    // console.log("LP PRICE USD", ethers.utils.formatEther(lpPriceUSD));
  })
  .catch(console.error);
