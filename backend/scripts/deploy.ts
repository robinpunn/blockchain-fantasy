import { ethers } from "hardhat";

async function main() {
  const FantasyContract = await ethers.getContractFactory("Fantasy");

  const fantasy = await FantasyContract.deploy();

  console.log(`deployed to ${fantasy.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*
deployed to 0x7BcF1609571b7a418aE68e42f2046338120A8f73

Successfully verified contract Fantasy on the block explorer.
https://sepolia.etherscan.io/address/0x7BcF1609571b7a418aE68e42f2046338120A8f73#code
*/
