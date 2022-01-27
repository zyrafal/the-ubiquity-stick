#! hh run
import { ethers, network } from "hardhat";

console.log(network.name);
ethers.provider.getBlockNumber().then(console.log);
