import { expect } from "chai";
import { ethers } from "hardhat";
import { Fantasy } from "../typechain-types";

let commissioner: any
let addr1: any
let addr2: any
let addr3: any
let addr4: any
let addr5: any
let factoryContract: any
let BUYIN = ethers.parseEther("1.0")

beforeEach(async function () {
  [commissioner, addr1, addr2, addr3, addr4, addr5] =
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

  it("Should be able to deploy multiple contracts with one address", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN)
    expect(await factoryContract.connect(commissioner).createFantasyContract(BUYIN)).to.not.be.reverted;
  });

  it("Should emit an event on deployment", async function () {
    const fantasy = await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    fantasy.wait()

    const fantasyContract = await factoryContract.connect(commissioner).getFantasyContract(0);

    await expect(fantasy)
      .to.emit(factoryContract, "FantasyContractCreation")
      .withArgs(fantasyContract, commissioner.address, 0);
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
    const tx = await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    tx.wait()
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    const fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await expect(tx)
      .to.emit(fantasyContract, "SeasonStarted")
      .withArgs(0, commissioner.address);

    await expect(tx)
      .to.emit(fantasyContract, "Whitelisted")
      .withArgs(0, commissioner.address);
  });
});


describe("Fantasy addToWhitelist() and players mapping", function () {
  let fantasyContract: Fantasy;

  before(async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;
  })

  it("Commissioner should already be whitelisted", async function () {
    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(commissioner.address)).to.be.true;
  });

  it("getWhiteListMemeber() should return false if player isn't whitelisted", async function () {
    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(addr1.address)).to.be.false;
  });

  it("Commissioner should be able to whitelist a player", async function () {
    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);

    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(addr1.address)).to.be.true;
  });

  it("Only commissioner should be able to whitelist a player", async function () {
    await expect(fantasyContract.connect(addr2).addToWhitelist(addr2.address)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__OnlyCommissionerCanPerformThisAction")
  });

  it("Commissioner should be able to whitelist multiple players", async function () {
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);

    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(addr2.address)).to.be.true;
    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(addr3.address)).to.be.true;
    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(addr4.address)).to.be.false;
  });

  it("Commissioner should not be able to whitelist the same player twice", async function () {
    await expect(fantasyContract.connect(commissioner).addToWhitelist(addr1.address)).to.be.revertedWithCustomError(fantasyContract, 'Fantasy__AddressAlreadyWhitelisted');
  });

  it("Whitelisting should emit an event", async function () {
    const whitelistTx = await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);
    await whitelistTx.wait();

    await expect(whitelistTx)
      .to.emit(fantasyContract, "Whitelisted")
      .withArgs(0, addr4.address);

    expect(await fantasyContract.connect(commissioner).getWhiteListedMember(addr4.address)).to.be.true;
  });
});

describe("buyIn() and s_prizePool", function () {
  let fantasyContract: Fantasy;

  before(async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);
  })

  it("Prizepool should start at 0", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(prizepool).to.equal(0);
  });

  it("Commissioner should be able to buy in", async function () {
    const buyin = await fantasyContract.connect(commissioner).buyIn(BUYIN)
    buyin.wait()

    const buyinStatus = await fantasyContract.connect(commissioner).getBuyInStatus(commissioner.address);
    expect(buyinStatus).to.be.true
  });

  it("Prizepool should update after buy in", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(prizepool).to.equal(BUYIN);
  });

  it("Should not be able to buy in twice", async function () {
    await expect(fantasyContract.connect(commissioner).buyIn(BUYIN)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayerAlreadyPaid")
  });

  it("Should not be able to buy in with 0", async function () {
    await expect(fantasyContract.connect(addr1).buyIn(0)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__IncorrectBuyInAmount")
  });

  it("Should not be able to buy in with wrong BUYIN amount", async function () {
    await expect(fantasyContract.connect(addr1).buyIn(ethers.parseEther("5.0"))).to.be.revertedWithCustomError(fantasyContract, "Fantasy__IncorrectBuyInAmount")
  });

  it("Should not be able to buy in if not whitelisted", async function () {
    await expect(fantasyContract.connect(addr5).buyIn(BUYIN)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__AddressNotWhitelisted")
  });

  it("Prizepool should update after multiple buy ins", async function () {
    await fantasyContract.connect(addr1).buyIn(BUYIN)
    await fantasyContract.connect(addr2).buyIn(BUYIN)
    await fantasyContract.connect(addr3).buyIn(BUYIN)
    await fantasyContract.connect(addr4).buyIn(BUYIN)
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(prizepool).to.equal(ethers.parseEther("5.0"));
  });

  it("Buying in should emit an event", async function () {
    await fantasyContract.connect(commissioner).addToWhitelist(addr5.address);
    const buyInTx = await fantasyContract.connect(addr5).buyIn(BUYIN)
    buyInTx.wait()

    await expect(buyInTx)
      .to.emit(fantasyContract, "PlayerBuyIn")
      .withArgs(addr5.address, BUYIN);
  });
});

describe("addWinnings() and s_prizePool", function () {
  let fantasyContract: Fantasy;

  before(async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN)
    await fantasyContract.connect(addr1).buyIn(BUYIN)
    await fantasyContract.connect(addr2).buyIn(BUYIN)
    await fantasyContract.connect(addr3).buyIn(BUYIN)
    await fantasyContract.connect(addr4).buyIn(BUYIN)
  })

  it("Should not be able to call addWinnings() if not whitelisted", async function () {
    let WINNING = ethers.parseEther("3.0")
    await expect(fantasyContract.connect(commissioner).addWinnings(addr5.address, WINNING)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayerNotInLeague")
  });

  it("Should not be able to call addWinnings() amount greater than prize pool", async function () {
    let WINNING = ethers.parseEther("6.0")
    await expect(fantasyContract.connect(commissioner).addWinnings(addr1.address, WINNING)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__ExceedsPrizePool")
  });

  it("Only commissioner can call addWinnings()", async function () {
    let WINNING = ethers.parseEther("3.0")
    await expect(fantasyContract.connect(addr1).addWinnings(commissioner.address, WINNING)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__OnlyCommissionerCanPerformThisAction")
  });

  it("Should be able to call addWinnings()", async function () {
    let WINNING = ethers.parseEther("3.0")

    await fantasyContract.connect(commissioner).addWinnings(addr1.address, WINNING)
  });

  it("Prizepool should update after addWinnings() is called", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(ethers.formatEther(prizepool)).to.equal('2.0');
  });

  it("Prizepool should update after addWinnings() called multiple times", async function () {
    const WINNING = ethers.parseEther("0.5")
    await fantasyContract.connect(commissioner).addWinnings(addr2.address, WINNING)
    await fantasyContract.connect(commissioner).addWinnings(addr3.address, WINNING)

    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(ethers.formatEther(prizepool)).to.equal('1.0');
  });

  it("Should be able to call addWinnings() multiple times to same player", async function () {
    const WINNING = ethers.parseEther("0.25")
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING)
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING)
  });

  it("Should accurately track user amounts", async function () {
    const addr1Winnings = await fantasyContract.connect(addr1).getSeasonWinnings()
    const addr2Winnings = await fantasyContract.connect(addr2).getSeasonWinnings()
    const addr3Winnings = await fantasyContract.connect(addr3).getSeasonWinnings()
    const addr4Winnings = await fantasyContract.connect(addr4).getSeasonWinnings()

    expect(ethers.formatEther(addr1Winnings)).to.equal('3.0');
    expect(ethers.formatEther(addr2Winnings)).to.equal('0.5');
    expect(ethers.formatEther(addr3Winnings)).to.equal('0.5');
    expect(ethers.formatEther(addr3Winnings)).to.equal('0.5');
  });

  it("addWinnings() should emit an event", async function () {
    const WINNING = ethers.parseEther("0.5")
    const buyInTx = await fantasyContract.connect(commissioner).addWinnings(commissioner.address, WINNING)
    buyInTx.wait()

    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(ethers.formatEther(prizepool)).to.equal('0.0');

    await expect(buyInTx)
      .to.emit(fantasyContract, "AddedWinning")
      .withArgs(commissioner.address, WINNING);
  });
});

/** TODO
 * fantasy contract withdraw
 * fantasy contract prizepool
 * fantasy contract players mapping
 * fantasy contract events
 * fantasy contract failing cases
 * fantasy add withdraw tracker
 * add complete season function
 */

