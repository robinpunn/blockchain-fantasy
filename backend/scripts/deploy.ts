import { ethers } from "hardhat";

async function main() {

  const FantasyContract = await ethers.getContractFactory("Fantasy");

  const fantasy = await FantasyContract.deploy();

  console.log(
    `deployed to ${fantasy.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*
deployed to 0x8C486D366701f03b30a8106410ed98eF1660DBa4

Successfully verified contract Fantasy on the block explorer.
https://sepolia.etherscan.io/address/0x8C486D366701f03b30a8106410ed98eF1660DBa4#code
*/
