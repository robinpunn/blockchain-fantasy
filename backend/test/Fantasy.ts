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
    console.log("factory contract: ", factoryContract.target)
    // console.log("factory: ", factoryContract)
    const lengthCheck = factoryContract.target.toString().length
    expect(lengthCheck).to.equal(42);
  });
});

describe("Fantasy Deployment", function () {
  it("Should not deploy with 0 buy in", async function () {
    await expect(factoryContract.connect(commissioner).createFantasyContract("0")).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__InvalidBuyInAmount()');
  });

  it("Should deploy the fantasy contract", async function () {
    expect(await factoryContract.connect(commissioner).createFantasyContract(buyIn)).to.not.be.reverted;
  });

  it("Should emit an event on deployment", async function () {
    const fantasy = await factoryContract.connect(commissioner).createFantasyContract(buyIn);

    const events = await factoryContract.queryFilter("FantasyContractCreation");

    const lengthCheck = events[0].args[0].toString().length
    expect(events.length).to.equal(1);
    expect(events[0].args[1]).to.equal(commissioner.address)
    expect(events[0].args[2]).to.equal(0)
    expect(lengthCheck).to.equal(42);
  });

  it("Should be able to deploy multiple contracts with one address", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(buyIn)
    expect(await factoryContract.connect(commissioner).createFantasyContract(buyIn)).to.not.be.reverted;
  });
});

describe("Factory variable/getter tests", function () {
  it("s_seasonCounter should start at 0", async function () {
    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(0);
  });

  it("s_seasonCounter should increment after multiple contract deployments", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);
    await factoryContract.connect(addr1).createFantasyContract(buyIn);
    await factoryContract.connect(addr2).createFantasyContract(buyIn);

    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(4);
  });

  it("getFantasyContract() should return deployed contract", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);

    const events = await factoryContract.queryFilter("FantasyContractCreation");
    const eventLog = events[0];
    const eventContract = eventLog.args[0];

    const fantasyContract = await factoryContract.connect(commissioner).getFantasyContract(0);

    expect(fantasyContract).to.equal(eventContract);
  });

  it("getFantasyContract() should return multiple deployed contracts from same user", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);

    const contract1 = await factoryContract.connect(commissioner).getFantasyContract(0);
    const contract2 = await factoryContract.connect(commissioner).getFantasyContract(1);

    expect(contract1).to.not.equal(contract2);
  });

  it("getFantasyContract() should return multiple deployed contracts from different users", async function () {
    await factoryContract.connect(addr1).createFantasyContract(buyIn);
    await factoryContract.connect(addr2).createFantasyContract(buyIn);

    const contract1 = await factoryContract.connect(addr1).getFantasyContract(0);
    const contract2 = await factoryContract.connect(addr2).getFantasyContract(1);

    expect(contract1).to.not.equal(contract2);
  });

  it("getFantasyContract() should revert for wrong user", async function () {
    await factoryContract.connect(addr1).createFantasyContract(buyIn);

    await expect(factoryContract.connect(commissioner).getFantasyContract(0)).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__ContractDoesNotExist');
  });

  it("getFantasyContract() should revert if contract hasn't been created", async function () {
    await expect(factoryContract.connect(commissioner).getFantasyContract(0)).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__ContractDoesNotExist');
  });

  it("getBuyIn() should return buy in", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(buyIn);

    const fantasyBuyIn = await factoryContract.connect(commissioner).getBuyIn(0);

    expect(fantasyBuyIn).to.equal(buyIn);
  });

  it("getBuyIn() should revert if contract hasn't been created", async function () {
    await expect(factoryContract.connect(commissioner).getBuyIn(0)).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__ContractDoesNotExist');
  });
});

/** TODO
 * fantasy contract variables
 * fantasy contract functions
 * fantasy contract getters
 * fantasy contract failing cases
 */

