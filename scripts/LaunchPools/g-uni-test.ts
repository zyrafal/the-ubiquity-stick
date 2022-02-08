#! ts-node

import type { Response } from "node-fetch";
import fetch from "node-fetch";
import fs from "fs";

const api = "https://api.thegraph.com/subgraphs/name/gelatodigital/g-uni";
const gql = fs.readFileSync("g-uni-pools-name.gql", "utf8");

const runQuery = async (url: string, query: Object, variables: Object): Promise<string> => {
  const res: Response = await fetch(url, { method: "POST", body: JSON.stringify({ query, variables }) });
  return await res.json();
};

runQuery(api, gql, { address: "0xa6c49fd13e50a30c65e6c8480aada132011d0613" })
  .then((res: any) => {
    const pool0 = res.data.pools[0];
    console.log(JSON.stringify(pool0, null, "  "));
  })
  .catch(console.error);
