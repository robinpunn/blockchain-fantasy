import { expect } from "chai";
import { ethers } from "hardhat";
import { Fantasy } from "../typechain-types";

let commissioner: any
let addr1: any
let addr2: any
let addr3: any
let addr4: any
let factoryContract: any
let BUYIN = ethers.parseEther("1.0")

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
    expect(await factoryContract.connect(commissioner).createFantasyContract(BUYIN)).to.not.be.reverted;
  });

  it("Should emit an event on deployment", async function () {
    const fantasy = await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const events = await factoryContract.queryFilter("FantasyContractCreation");

    const lengthCheck = events[0].args[0].toString().length
    expect(events.length).to.equal(1);
    expect(events[0].args[1]).to.equal(commissioner.address)
    expect(events[0].args[2]).to.equal(0)
    expect(lengthCheck).to.equal(42);
  });

  it("Should be able to deploy multiple contracts with one address", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN)
    expect(await factoryContract.connect(commissioner).createFantasyContract(BUYIN)).to.not.be.reverted;
  });
});

describe("Factory variable/getter tests", function () {
  it("s_seasonCounter should start at 0", async function () {
    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(0);
  });

  it("s_seasonCounter should increment after multiple contract deployments", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    await factoryContract.connect(addr1).createFantasyContract(BUYIN);
    await factoryContract.connect(addr2).createFantasyContract(BUYIN);

    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(4);
  });

  it("getFantasyContract() should return deployed contract", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const events = await factoryContract.queryFilter("FantasyContractCreation");
    const eventLog = events[0];
    const eventContract = eventLog.args[0];

    const fantasyContract = await factoryContract.connect(commissioner).getFantasyContract(0);

    expect(fantasyContract).to.equal(eventContract);
  });

  it("getFantasyContract() should return multiple deployed contracts from same user", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const contract1 = await factoryContract.connect(commissioner).getFantasyContract(0);
    const contract2 = await factoryContract.connect(commissioner).getFantasyContract(1);

    expect(contract1).to.not.equal(contract2);
  });

  it("getFantasyContract() should return multiple deployed contracts from different users", async function () {
    await factoryContract.connect(addr1).createFantasyContract(BUYIN);
    await factoryContract.connect(addr2).createFantasyContract(BUYIN);

    const contract1 = await factoryContract.connect(addr1).getFantasyContract(0);
    const contract2 = await factoryContract.connect(addr2).getFantasyContract(1);

    expect(contract1).to.not.equal(contract2);
  });

  it("getFantasyContract() should revert for wrong user", async function () {
    await factoryContract.connect(addr1).createFantasyContract(BUYIN);

    await expect(factoryContract.connect(commissioner).getFantasyContract(0)).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__ContractDoesNotExist');
  });

  it("getFantasyContract() should revert if contract hasn't been created", async function () {
    await expect(factoryContract.connect(commissioner).getFantasyContract(0)).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__ContractDoesNotExist');
  });

  it("getBuyIn() should return buy in", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const fantasyBuyIn = await factoryContract.connect(commissioner).getBuyIn(0);

    expect(fantasyBuyIn).to.equal(BUYIN);
  });

  it("getBuyIn() should revert if contract hasn't been created", async function () {
    await expect(factoryContract.connect(commissioner).getBuyIn(0)).to.be.revertedWithCustomError(factoryContract, 'Fantasy_Factory__ContractDoesNotExist');
  });
});

describe("Fantasy constructor", function () {
  it("Should set variables", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;
    const seasonId = await fantasyContract.connect(commissioner).getSeasonId();
    const buyIn = await fantasyContract.connect(commissioner).getBuyInAmount();
    const commish = await fantasyContract.connect(commissioner).getSeasonCommissioner();

    expect(Number(seasonId)).to.equal(0);
    expect(buyIn).to.equal(BUYIN);
    expect(commish).to.equal(commissioner.address);
  });
  it("Should emit events when constructor is called", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);
    
    const FantasyContract = await ethers.getContractFactory("Fantasy");
    const fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    const filter = factoryContract.filters.SeasonStarted();
    console.log(filter)
    // const events = await fantasyContract.queryFilter(filter);
    // expect(Number(events[0].args[0])).to.equal(0)
    // expect(events[0].args[1]).to.equal(commissioner.address)
  });
});


// describe("Fantasy getter functions", function () {
  
// });

/** TODO
 * fantasy contract prizepool
 * fantasy contract players mapping
 * fantasy contract events
 * fantasy contract failing cases
 */

