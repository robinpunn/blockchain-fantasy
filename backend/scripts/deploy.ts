import { ethers } from "hardhat";

async function main() {
  const FantasyFactory = await ethers.getContractFactory("FantasyFactory");

  const fantasyFactory = await FantasyFactory.deploy();

  console.log(`deployed to ${fantasyFactory.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*
Old contract
deployed to 0x7BcF1609571b7a418aE68e42f2046338120A8f73

Successfully verified contract Fantasy on the block explorer.
https://sepolia.etherscan.io/address/0x7BcF1609571b7a418aE68e42f2046338120A8f73#code
*/
