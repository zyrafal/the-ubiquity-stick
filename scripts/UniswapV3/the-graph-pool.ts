#! ts-node

import fetch from "node-fetch";

const url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
const gql = `{
  pools(where: {id: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"}) {
    id
    totalValueLockedETH
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

async function graphQL(url: string, query: Object): Promise<string> {
  let json = "";
  try {
    const response = await fetch(url, { method: "POST", body: JSON.stringify({ query }) });
    json = (await response.json()) as string;
  } catch (error) {
    console.error(error);
  }
  return json;
}

graphQL(url, gql).then((res) => {
  console.log(JSON.stringify(res, null, "  "));
});
