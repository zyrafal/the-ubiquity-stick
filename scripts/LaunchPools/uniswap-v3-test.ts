#! ts-node

import type { Response } from "node-fetch";
import fetch from "node-fetch";
import fs from "fs";

const api = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
const gql = fs.readFileSync("uniswap-v3-pools-full.gql", "utf8");

const runQuery = async (url: string, query: Object, variables: Object): Promise<string> => {
  const res: Response = await fetch(url, { method: "POST", body: JSON.stringify({ query, variables }) });
  return await res.json();
};

runQuery(api, gql, { address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640" })
  .then((res: any) => {
    const pool0 = res.data.pools[0];
    console.log(JSON.stringify(pool0, null, "  "));
  })
  .catch(console.error);
