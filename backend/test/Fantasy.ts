import { expect } from "chai";
import { ethers } from "hardhat";

let commissioner: any
let addr1: any
let addr2: any
let addr3: any
let addr4: any
let factoryContract: any
let buyIn = ethers.parseEther("1.0")

beforeEach(async function () {
  [commissioner, addr1, addr2, addr3, addr4] =
    await ethers.getSigners();

  factoryContract = await ethers.deployContract("FantasyFactory");
  await factoryContract.waitForDeployment()
})

describe("Factory Deployment", function () {
  it("Should deploy the factory contract", async function () {
    console.log("factory contract: ", factoryContract.target, "factory: ", factoryContract)
    const lengthCheck = factoryContract.target.toString().length
    expect(lengthCheck).to.equal(42);
  });
});

describe("Fantasy Deployment", function () {
  it("Should deploy the fantasy contract", async function () {

    await factoryContract.connect(commissioner).createFantasyContract(buyIn);
    const counter = await factoryContract.getSeasonCounter();

    expect(counter).to.equal(1);
  });
  it("Should emit an event on deployment", async function () {
    const fantasy = await factoryContract.connect(commissioner).createFantasyContract(buyIn);

    const events = await factoryContract.queryFilter("FantasyContractCreation");

    const lengthCheck = events[0].args[0].toString().length
    expect(events.length).to.equal(1);
    expect(events[0].args[1]).to.equal(commissioner.address)
    expect(events[0].args[2]).to.equal(0)
    expect(lengthCheck).to.equal(42);
    // expect(event.event).to.equal("FantasyContractCreation");
  });
});

describe("Factory Variable tests", function () {
  it("Counter should start at 0", async function () {
    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(0);
  });

  it("Counter should increment after multiple contracts", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);
    await factoryContract.connect(addr1).createFantasyContract(buyIn);
    await factoryContract.connect(addr2).createFantasyContract(buyIn);

    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(3);
  });
});

// describe("Season", function () {
//   it("Should start a season", async function () {
//     const { fantasyContract } = await loadFixture(deployContractFixture);
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);

//     const seasonStarted = await fantasyContract.seasonCounter();
//     // console.log(`Season counter: ${seasonStarted}`);

//     expect(seasonStarted).to.equal(1);
//   });
//   it("Should set buy in", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);
//     const buyIn = await fantasyContract.getBuyInAmount(0);

//     expect(buyIn).to.equal(amount);
//   });
//   it("Should not be able to join if not whitelisted", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);

//     await expect(fantasyContract.connect(addr1).buyIn(0, amount)).to.be
//       .revertedWithCustomError;
//   });

//   it("Should not be able to join season that hasn't started", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);

//     await expect(fantasyContract.connect(addr1).buyIn(1, amount)).to.be
//       .revertedWithCustomError;
//   });
// });

// describe("Players", function () {
//   it("Should be the commisioner", async function () {
//     const { fantasyContract, commissioner } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);

//     const commish = await fantasyContract.getSeasonCommissioner(0);
//     // console.log(
//     //   `Season commish: ${commish}\n Commisioner: ${commissioner.address} `
//     // );

//     expect(commissioner.address).to.equal(commish);
//   });

//   it("Should allow commissioner to by in", async function () {
//     const { fantasyContract, commissioner } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);

//     await fantasyContract.connect(commissioner).buyIn(0, amount);

//     const player = await fantasyContract.getPlayer(0, commissioner.address);

//     expect(player).to.be.true;
//   });

//   it("Should be able to whitelist", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);
//     await fantasyContract.addToWhitelist(0, addr1.address);
//     const whitelisted = await fantasyContract.getWhiteListedMember(
//       0,
//       addr1.address
//     );

//     expect(whitelisted).to.be.true;
//   });

//   it("Whitelist should be able to buy in", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");

//     await fantasyContract.addSeason(amount);
//     await fantasyContract.addToWhitelist(0, addr1.address);

//     await expect(fantasyContract.connect(addr1).buyIn(0, amount)).to.not.be
//       .reverted;
//   });

//   it("Whitelist should not be able to buy in with lesser amount", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");
//     const smallAmount = ethers.parseEther("0.5");

//     await fantasyContract.addSeason(amount);
//     await fantasyContract.addToWhitelist(0, addr1.address);

//     await expect(fantasyContract.connect(addr1).buyIn(0, smallAmount)).to.be
//       .revertedWithCustomError;
//   });

//   it("Whitelist should not be able to buy in with larger amount", async function () {
//     const { fantasyContract, addr1 } = await loadFixture(
//       deployContractFixture
//     );
//     const amount = ethers.parseEther("1");
//     const largeAmount = ethers.parseEther("2");

//     await fantasyContract.addSeason(amount);
//     await fantasyContract.addToWhitelist(0, addr1.address);

//     await expect(fantasyContract.connect(addr1).buyIn(0, largeAmount)).to.be
//       .revertedWithCustomError;
//   });
// });

