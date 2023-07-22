import { ethers } from "hardhat";

async function main() {

  const buyInEther = 0.0005

  const buyInWei = ethers.parseEther(buyInEther.toString());

  const FantasyContract = await ethers.getContractFactory("Fantasy");

  const fantasy = await FantasyContract.deploy(buyInWei);

  console.log(
    `deployed to ${fantasy.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
