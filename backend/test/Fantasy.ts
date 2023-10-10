const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deployment", function () {
  async function deployContractFixture() {
    const [commissioner, addr1, addr2, addr3, addr4] =
      await ethers.getSigners();

    const fantasyContract = await ethers.deployContract("Fantasy");

    return { fantasyContract, commissioner, addr1, addr2, addr3, addr4 };
  }

  it("Should deploy the contract", async function () {
    const { fantasyContract } = await loadFixture(deployContractFixture);

    // console.log(`Contract deployed to: ${fantasyContract.target}`);

    expect(fantasyContract.target).to.not.equal("0x0");
  });

  it("Should start a season", async function () {
    const { fantasyContract } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);

    const seasonStarted = await fantasyContract.seasonCounter();
    // console.log(`Season counter: ${seasonStarted}`);

    expect(seasonStarted).to.equal(1);
  });

  it("Should be the commisioner", async function () {
    const { fantasyContract, commissioner } = await loadFixture(
      deployContractFixture
    );
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);

    const commish = await fantasyContract.getSeasonCommissioner(0);
    console.log(
      `Season commish: ${commish}\n Commisioner: ${commissioner.address} `
    );

    expect(commissioner.address).to.equal(commish);
  });
});
