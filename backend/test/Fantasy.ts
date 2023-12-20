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
  // const balance = await ethers.provider.getBalance(addr1.address);
  // const balance2 = await ethers.provider.getBalance(addr2.address);
  // console.log("bal1: ", ethers.formatEther(balance), "bal2: ", ethers.formatEther(balance2))
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
  it("s_seasonCounter should increment after multiple contract deployments", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    await factoryContract.connect(addr1).createFantasyContract(BUYIN);
    await factoryContract.connect(addr2).createFantasyContract(BUYIN);

    const counter = await factoryContract.getSeasonCounter();
    expect(counter).to.equal(4);
  });
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
    const fantasyFactoryContract = await fantasyContract.connect(commissioner).getFactory();

    expect(Number(seasonId)).to.equal(0);
    expect(buyIn).to.equal(BUYIN);
    expect(commish).to.equal(commissioner.address);
    expect(fantasyFactoryContract).to.equal(factoryContract.target)
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

describe("Fantasy buyIn(), s_prizePool, and getBalance()", function () {
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
    const buyin = await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    buyin.wait()

    const buyinStatus = await fantasyContract.connect(commissioner).getBuyInStatus(commissioner.address);
    expect(buyinStatus).to.be.true
  });

  it("s_prizePool should update after buy in", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(prizepool).to.equal(BUYIN);
  });

  it("getBalance() should update after buy in", async function () {
    const contractBalance = await fantasyContract.connect(commissioner).getBalance();
    expect(contractBalance).to.equal(BUYIN);
  });

  it("Should not be able to buy in twice", async function () {
    await expect(fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayerAlreadyPaid")
  });

  it("Should not be able to buy in with 0", async function () {
    await expect(fantasyContract.connect(addr1).buyIn(0, { value: 0 })).to.be.revertedWithCustomError(fantasyContract, "Fantasy__IncorrectBuyInAmount")
  });

  it("Should not be able to buy in with wrong BUYIN amount", async function () {
    await expect(fantasyContract.connect(addr1).buyIn(ethers.parseEther("5.0"), { value: ethers.parseEther("5.0") })).to.be.revertedWithCustomError(fantasyContract, "Fantasy__IncorrectBuyInAmount")
  });

  it("Should not be able to buy in if not whitelisted", async function () {
    await expect(fantasyContract.connect(addr5).buyIn(BUYIN, { value: BUYIN })).to.be.revertedWithCustomError(fantasyContract, "Fantasy__AddressNotWhitelisted")
  });

  it("Prizepool should update after multiple buy ins", async function () {
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr4).buyIn(BUYIN, { value: BUYIN })
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool();
    expect(prizepool).to.equal(ethers.parseEther("5.0"));
  });

  it("getBalance() should update after multiple buy ins", async function () {
    const contractBalance = await fantasyContract.connect(commissioner).getBalance();
    expect(contractBalance).to.equal(ethers.parseEther("5.0"));
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

describe("Fantasy addWinnings() and s_prizePool", function () {
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

  it("Should not be able to call addWinnings() if buy in not paid", async function () {
    let WINNING = ethers.parseEther("3.0")
    await fantasyContract.connect(commissioner).addToWhitelist(addr5.address);
    // await fantasyContract.connect(addr5).buyIn(BUYIN)
    await expect(fantasyContract.connect(commissioner).addWinnings(addr5.address, WINNING)).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayerDidNotPayBuyIn")
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
    expect(ethers.formatEther(addr4Winnings)).to.equal('0.5');
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

describe("Fantasy withdrawWinnings() and getBalance()", function () {
  let fantasyContract: Fantasy;

  before(async function () {
    const WINNING1 = ethers.parseEther("3.0")
    const WINNING2 = ethers.parseEther("0.5")

    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr4).buyIn(BUYIN, { value: BUYIN })

    await fantasyContract.connect(commissioner).addWinnings(addr1.address, WINNING1)
    await fantasyContract.connect(commissioner).addWinnings(addr2.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr3.address, WINNING2)
  })

  it("Should not be able to call withdrawWinnings() if not whitelisted", async function () {
    await expect(fantasyContract.connect(addr5).withdrawWinnings()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__AddressNotWhitelisted")
  });

  it("Should not be able to call withdrawWinnings() if no winnings", async function () {
    await expect(fantasyContract.connect(addr4).withdrawWinnings()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__NoWinningsToWithdraw")
  });

  it("Should be able to call withdrawWinnings()", async function () {
    await fantasyContract.connect(addr1).withdrawWinnings()
  });

  it("User's balance should update after withdrawWinnings() is called", async function () {
    const addr1Winnings = await fantasyContract.connect(addr1).getSeasonWinnings()
    expect(ethers.formatEther(addr1Winnings)).to.equal('0.0');
  });

  it("Contract balance should update after withdrawWinnings() is called", async function () {
    const contractBalance = await fantasyContract.connect(addr1).getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal('2.0');
  });

  it("Should be able to call withdrawWinnings() multiple times", async function () {
    const WINNING = ethers.parseEther("0.25")
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING)
    await fantasyContract.connect(addr4).withdrawWinnings()
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING)
    await fantasyContract.connect(addr4).withdrawWinnings()
  });

  it("User's balance should update after withdrawWinnings() is called multiple times", async function () {
    let addr3Winnings = await fantasyContract.connect(addr3).getSeasonWinnings()
    expect(ethers.formatEther(addr3Winnings)).to.equal('0.5');

    await fantasyContract.connect(addr3).withdrawWinnings()
    addr3Winnings = await fantasyContract.connect(addr3).getSeasonWinnings()
    expect(ethers.formatEther(addr3Winnings)).to.equal('0.0');
  });

  it("Contract balance should update after withdrawWinnings() is called multiple times", async function () {
    const contractBalance = await fantasyContract.connect(commissioner).getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal('1.0');
  });

  it("Commissioner should be able to call withdrawWinnings()", async function () {
    await fantasyContract.connect(commissioner).addWinnings(commissioner.address, ethers.parseEther("0.5"))
    await fantasyContract.connect(commissioner).withdrawWinnings()
    const contractBalance = await fantasyContract.connect(commissioner).getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal('0.5');
  });

  it("withdrawWinnings() should emit an event", async function () {
    const withdrawTx = await fantasyContract.connect(addr2).withdrawWinnings()
    withdrawTx.wait()

    await expect(withdrawTx)
      .to.emit(fantasyContract, "PlayerWithdraw")
      .withArgs(addr2.address, ethers.parseEther("0.5"));
  });
});

describe("Fantasy completeSeason()", function () {
  let fantasyContract: Fantasy;
  const WINNING1 = ethers.parseEther("3.0")
  const WINNING2 = ethers.parseEther("0.5")

  before(async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr4).buyIn(BUYIN, { value: BUYIN })
  })

  it("s_seasonComplete should not be true until completeSeason() is successfully executed", async function () {
    const seasonStatus = await fantasyContract.connect(commissioner).getSeasonStatus()
    expect(seasonStatus).to.be.false
  });

  it("Only commissioner should be able to call completeSeason()", async function () {
    await expect(fantasyContract.connect(addr1).completeSeason()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__OnlyCommissionerCanPerformThisAction")
  });

  it("Should not be able to call completeSeason() before distributing with addWinnings()", async function () {
    await expect(fantasyContract.connect(commissioner).completeSeason()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayersStillNeedToWithdraw")
  });

  it("Should not be able to call withdrawWinnings() based on s_prizePool == 0", async function () {
    await fantasyContract.connect(commissioner).addWinnings(addr1.address, WINNING1)
    await fantasyContract.connect(commissioner).addWinnings(addr2.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr3.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(commissioner.address, WINNING2)

    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(prizepool).to.equal(0)
    await expect(fantasyContract.connect(commissioner).completeSeason()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayersStillNeedToWithdraw")
  });

  it("Should not be able to call completeSeason() if all players have not withdrawn", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(prizepool).to.equal(0)

    await fantasyContract.connect(addr1).withdrawWinnings()
    const contractBalance = await fantasyContract.getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal("2.0")

    await expect(fantasyContract.connect(commissioner).completeSeason()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__PlayersStillNeedToWithdraw")
  });

  it("Only commissioner should be able to call completeSeason() even after all players have withdrawn", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(prizepool).to.equal(0)

    await fantasyContract.connect(addr2).withdrawWinnings()
    await fantasyContract.connect(addr3).withdrawWinnings()
    await fantasyContract.connect(addr4).withdrawWinnings()
    await fantasyContract.connect(commissioner).withdrawWinnings()
    const contractBalance = await fantasyContract.getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal("0.0")

    await expect(fantasyContract.connect(addr1).completeSeason()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__OnlyCommissionerCanPerformThisAction")
  });

  it("Should be able to successfully call completeSeason() and it should emit an event", async function () {
    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(prizepool).to.equal(0)

    const contractBalance = await fantasyContract.getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal("0.0")

    const completeTx = await fantasyContract.connect(commissioner).completeSeason()

    await expect(completeTx)
      .to.emit(fantasyContract, "SeasonCompleted")
      .withArgs(0, commissioner.address);
  });

  it("s_seasonComplete should be true after completeSeason() is successfully executed", async function () {
    const seasonStatus = await fantasyContract.connect(commissioner).getSeasonStatus()
    expect(seasonStatus).to.be.true
  });

});

describe("Factory removeFantasyContract()", function () {
  let fantasyContract: Fantasy;
  const WINNING1 = ethers.parseEther("3.0")
  const WINNING2 = ethers.parseEther("0.5")

  before(async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr4).buyIn(BUYIN, { value: BUYIN })

    await fantasyContract.connect(commissioner).addWinnings(addr1.address, WINNING1)
    await fantasyContract.connect(commissioner).addWinnings(addr2.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr3.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(commissioner.address, WINNING2)

    await fantasyContract.connect(addr1).withdrawWinnings()
    await fantasyContract.connect(addr2).withdrawWinnings()
    await fantasyContract.connect(addr3).withdrawWinnings()
    await fantasyContract.connect(addr4).withdrawWinnings()
    await fantasyContract.connect(commissioner).withdrawWinnings()
  })

  it("Variable check", async function () {
    const seasonComplete = await fantasyContract.connect(commissioner).getSeasonStatus()
    expect(seasonComplete).to.be.false

    const prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(prizepool).to.equal(0)

    const contractBalance = await fantasyContract.getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal("0.0")
  });

  it("Should not be able to successfully call removeFantasyContract() directly from factory contract", async function () {
    await expect(factoryContract.connect(commissioner).removeFantasyContract(commissioner.address, 0)).to.be.revertedWithCustomError(factoryContract, "Fantasy_Factory__MustCallFromContract");
    await expect(factoryContract.connect(commissioner).removeFantasyContract(fantasyContract.target, 0)).to.be.revertedWithCustomError(factoryContract, "Fantasy_Factory__MustCallFromContract");
  });

  it("Contract should not exist in s_fantasyContracts after calling seasonComplete()", async function () {
    const completeTx = await fantasyContract.connect(commissioner).completeSeason()
    completeTx.wait()

    const seasonComplete = await fantasyContract.connect(commissioner).getSeasonStatus()
    expect(seasonComplete).to.be.true

    await expect(factoryContract.connect(commissioner).getFantasyContract(0)).to.be.revertedWithCustomError(factoryContract, "Fantasy_Factory__ContractDoesNotExist");
  });

  it("Should not be able to call seasonComplete() twice", async function () {
    await expect(fantasyContract.connect(commissioner).completeSeason()).to.be.revertedWithCustomError(fantasyContract, "Fantasy__SeasonAlreadyComplete");
  });
});

describe("Factory removeFantasyContract() event", function () {
  let fantasyContract: Fantasy;
  const WINNING1 = ethers.parseEther("3.0")
  const WINNING2 = ethers.parseEther("0.5")

  it("Should emit an event from removeFantasyContract() when seasonComplete() is called", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);

    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr4).buyIn(BUYIN, { value: BUYIN })

    let prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(ethers.formatEther(prizepool)).to.equal("5.0");

    let contractBalance = await fantasyContract.getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal("5.0")

    await fantasyContract.connect(commissioner).addWinnings(addr1.address, WINNING1)
    await fantasyContract.connect(commissioner).addWinnings(addr2.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr3.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(addr4.address, WINNING2)
    await fantasyContract.connect(commissioner).addWinnings(commissioner.address, WINNING2)

    await fantasyContract.connect(addr1).withdrawWinnings()
    await fantasyContract.connect(addr2).withdrawWinnings()
    await fantasyContract.connect(addr3).withdrawWinnings()
    await fantasyContract.connect(addr4).withdrawWinnings()
    await fantasyContract.connect(commissioner).withdrawWinnings()

    let seasonComplete = await fantasyContract.connect(commissioner).getSeasonStatus()
    expect(seasonComplete).to.be.false

    prizepool = await fantasyContract.connect(commissioner).getSeasonPrizePool()
    expect(prizepool).to.equal(0)

    contractBalance = await fantasyContract.getBalance()
    expect(ethers.formatEther(contractBalance)).to.equal("0.0")

    const completeTx = await fantasyContract.connect(commissioner).completeSeason()
    completeTx.wait()

    seasonComplete = await fantasyContract.connect(commissioner).getSeasonStatus()
    expect(seasonComplete).to.be.true

    await expect(completeTx)
      .to.emit(factoryContract, "ContractRemoved")
      .withArgs(fantasyContract.getAddress, 0, commissioner.address);
  })
});

describe("Fantasy tipCommissioner()", function () {
  let fantasyContract: Fantasy;
  const WINNING1 = ethers.parseEther("3.0")
  const WINNING2 = ethers.parseEther("0.5")

  it("Should not be able to call tipCommissioner() if not whitelisted", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })

    const tip = ethers.parseEther("0.1")
    await expect(fantasyContract.connect(addr5).tipCommissioner({ value: tip })).to.be.revertedWithCustomError(fantasyContract, "Fantasy__AddressNotWhitelisted")
  });

  it("Should not be able to call tipCommissioner() with amount less than 0.001 ether", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })

    const tip = ethers.parseEther("0.0001")
    await expect(fantasyContract.connect(addr4).tipCommissioner({ value: tip })).to.be.revertedWithCustomError(fantasyContract, "Fantasy__TipTooSmall")
  });

  it("Should be able to call tipCommissioner() and emit an event", async function () {
    await factoryContract.connect(commissioner).createFantasyContract(BUYIN);
    const fantasyContractAddress = await factoryContract.connect(commissioner).getFantasyContract(0);

    const FantasyContract = await ethers.getContractFactory("Fantasy");
    fantasyContract = FantasyContract.attach(fantasyContractAddress) as Fantasy;

    await fantasyContract.connect(commissioner).addToWhitelist(addr1.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr2.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr3.address);
    await fantasyContract.connect(commissioner).addToWhitelist(addr4.address);

    await fantasyContract.connect(commissioner).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr1).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr2).buyIn(BUYIN, { value: BUYIN })
    await fantasyContract.connect(addr3).buyIn(BUYIN, { value: BUYIN })

    const tip = ethers.parseEther("0.001")
    const tipCommisioner = await fantasyContract.connect(addr4).tipCommissioner({ value: tip, gasLimit: 3000000 })
    await tipCommisioner.wait()

    await expect(tipCommisioner)
      .to.emit(fantasyContract, "TippedCommissioner")
      .withArgs(addr4.address, ethers.parseEther(".001"));
  });
});

/** TODO
 * tipCommissioner
 */

