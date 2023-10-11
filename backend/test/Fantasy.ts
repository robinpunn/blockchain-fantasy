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

  it("Should set buy in", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);
    const buyIn = await fantasyContract.getBuyInAmount(0);

    expect(buyIn).to.equal(amount);
  });

  it("Should not be able to join if not whitelisted", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);

    await expect(
      fantasyContract.connect(addr1).buyIn(0, amount)
    ).to.be.revertedWith("Address not whitelisted");
  });

  it("Should not be able to join season that hasn't started", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);

    await expect(fantasyContract.connect(addr1).buyIn(1, amount)).to.be
      .revertedWithPanic;
  });

  it("Should be able to whitelist", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);
    await fantasyContract.addToWhitelist(0, addr1.address);
    const whitelisted = await fantasyContract.getWhiteListedMember(
      0,
      addr1.address
    );

    expect(whitelisted).to.be.true;
  });

  it("Whitelist should be able to buy in", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");

    await fantasyContract.addSeason(amount);
    await fantasyContract.addToWhitelist(0, addr1.address);

    await expect(fantasyContract.connect(addr1).buyIn(0, amount)).to.not.be
      .reverted;
  });

  it("Whitelist should not be able to buy in with lesser amount", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");
    const smallAmount = ethers.parseEther("0.5");

    await fantasyContract.addSeason(amount);
    await fantasyContract.addToWhitelist(0, addr1.address);

    await expect(
      fantasyContract.connect(addr1).buyIn(0, smallAmount)
    ).to.be.revertedWith("Incorrect buy-in amount");
  });

  it("Whitelist should not be able to buy in with larger amount", async function () {
    const { fantasyContract, addr1 } = await loadFixture(deployContractFixture);
    const amount = ethers.parseEther("1");
    const largeAmount = ethers.parseEther("2");

    await fantasyContract.addSeason(amount);
    await fantasyContract.addToWhitelist(0, addr1.address);

    await expect(
      fantasyContract.connect(addr1).buyIn(0, largeAmount)
    ).to.be.revertedWith("Incorrect buy-in amount");
  });
});
