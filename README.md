# Blockchain Fantasy
This was created as a final project for Alchemy University's Ethereum Bootcamp.

## What is this?
The is a Solidity smart contract that handles payments for fantasy sports leagues. The original smart contract, Version 1.0, has gone through some changes. Version 2.0 is the current version of the smart contract. Read about both below.

### Key Terms
- `season`: The term used to refer to an active `Fantasy` contract
- `commissioner`: Each `Fantasy` contract has a `commissioner` that functions as the owner of the contract. This is the address that deploys the `Fantasy` contract from the `FantasyFactory` contract
- `buyIn`: The value required to pay in order to join a `season`/`Fantasy` contract   

<details>

<summary> Version 2.0 </summary>

## Version 2.0
The contract has been upgraded to utilize the factory pattern.

### How does it work?
Originally, all of the state was managed by one contract. A user would create a league and invite league members.  The smart contract would be responsible for handling payments for the created fantasy league.  A single contract kept track of every league that was created along with all of the funds for each league.
Version 2.0 Implements a factory pattern.  Users initially interact with a factory contract which keeps track of all the contracts that are deployed. The factory pattern allows for each league to exist within its own contract.  All the funds are no longer tied to a single contract but with each individual contract deployed by the factory.

### The smart contracts
#### `FantasyFactory.sol`
This is the factory contract that users will initially interact with.  The purpose of the contract is to create a new smart contract. This is handled through the `createFantasyContract()` function:
```solidity
function createFantasyContract(uint256 _buyIn) external {
        if (_buyIn <= 0) {
            revert Fantasy_Factory__InvalidBuyInAmount();
        }

        uint256 currentId = s_seasonCounter;

        Fantasy newFantasyContract = new Fantasy(
            payable(msg.sender),
            currentId,
            _buyIn,
            address(this)
        );

        Season storage season = s_fantasyContracts[msg.sender][currentId];
        season.fantasyContract = address(newFantasyContract);
        season.buyIn = _buyIn;

        s_seasonCounter++;

        emit FantasyContractCreation(
            address(newFantasyContract),
            msg.sender,
            currentId
        );
    }
```
- `createFantasyContract()` takes one argument, a `uint256`.  This argument sets the buy in for the league that is going to be created.
- The league id is set by the `s_seasonCounter` state variable found in the `FantasyFactory` contract.  The `s_seasonCounter` will be incremented by this function.
- The contract creates a new `Fantasy` contract passing to it 4 arguments: 
	- `msg.sender`: The address of the user calling the function 
	- `currentId`: The current value of `s_seasonCounter` to set the season id
	- `_buyIn`: The buy in amount that members will have to pay to join the league
	- `address(this)`: The contract address to the factory contract. This is done to make it easier for the `Fantasy` contract to call a function on the `FantasyFactory` contract
- The function updates the mapping which tracks all the `Fantasy` contracts that have been deployed associating the contract with the user that deployed the contract. The id of the contract is also used for tracking so a user can deploy multiple contracts

When a season is "completed", it is removed from the `s_fantasyContracts` mapping.  This is done through the `removeFantasyContract` function:
```solidity
function removeFantasyContract(address _owner, uint256 _seasonId) external {
    if (
        msg.sender != s_fantasyContracts[_owner][_seasonId].fantasyContract
    ) {
        revert Fantasy_Factory__MustCallFromContract();
    }
    delete s_fantasyContracts[_owner][_seasonId];

    emit ContractRemoved(msg.sender, _seasonId, _owner);
}
```  
- The function takes two arguments, an address `_owner`, and a uint256 `_seasonId`. 
    - These two arguments will be used to retrieve the `Fantasy` contract from `s_fantasyContracts`.  
- This function is called from the `Fantasy` contract when the commissioner calls the `completeSeason` function.  
    - That means that the `msg.sender` of this function must be the actual `Fantasy` contract.  
    - This ensures that account addresses cannot call the function.  
    - Only the commissioner of the calling `Fantasy` contract will be able to successfully initiate this function.

The factory contract has some getter functions to help retrieve data.
- `getFantasyContract` returns the address of a deployed `Fantasy` contract based on season id. While this function doesn't have an explicit `onlyOwner` modifier, the address of the caller will be used to access the `s_fantasyContracts` mapping. Technically, this is a function meant to be called by commissioners to retrieve their contracts.
- `getBuyIn` returns the buy in amount for a deployed `Fantasy` contract. Like the previous function, it uses the season id and the address of the function caller to access the `s_fantasyContracts` mapping. 
-`getSeasonCounter` is a function anyone can call to see the value of the `s_seasonCounter` variable which is responsible for settings season ids.

One of the main changes in this new contract is the `Season` struct. 
    - In Version 1, the `Season` struct contained all of the information related to a season created by a commissioner.  This information included the `commissioner`, `id`, `players`, and more.  
        - It was necessary for the `Season` struct to be this dense because of the lack of a factory pattern. 
        - In version 1, there was only a single contract, so all of the necessary information was stored in the `Season` struct. 
    - In Version 2.0, the `Season` struct does not bear as much responsibility. It is only found in the `FantasyFactory` contract. 
        - It only contains the address of the deployed `Fantasy` contract along with the `buyIn`
        - The `Season` struct is contained within a mapping which is accessed with the ``commissioner`` address and `seasonId`

#### `Fantasy.sol`
The factory pattern's benefit is highlighted by the `Fantasy.sol` contract.  A user that wants to create a `Fantasy` contract will first interact with the `FantasyFactory.sol` contract. Interaction with `FantasyFactory` will lead to the creation of a `Fantasy` contract.  This `Fantasy` contract will hold all of the state specfic to a single season.  The user that deployed the `Fantasy` contract will become the commissioner of the contract. This is a major improvement from `Version 1.0` due to the fact that `Version 1.0` handle every season created in one main contract.  The dynamic of having a single `Fantasy` contract is a security improvement considering funds are now tied to various individual contracts rather than being accumulated in one single contract.

##### State Variables
The `Fantasy` contract has important **state variables**:
```solidity
    bool private s_seasonComplete;
    uint256 private immutable i_seasonId;
    address private immutable i_commissioner;
    uint256 private immutable i_buyIn;
    address private immutable i_factory;
    uint256 private s_prizePool;
    mapping(address => Player) players;
```
- `s_seasonComplete` is a boolean used to handle deletion of the smart contract from the `FantasyFactory` mapping. It can only be true once everyone has received their winnings.
- `i_seasonId` is an immutable uint256, and it is set when the contract is created. The value is sent from the `FantasyFactory` contract. This value allows a user to deploy multiple contracts as it is a key in the `s_fantasyContracts` found in `FantasyFactory`
- `i_commissioner` is and immutable address, and it is set when the contract is created. The value is sent from the `FantasyFactory` contract, and the address is the commissioner/owner of the contract.
- `i_buyIn` is an immutable uint256 that acts as a monetary gateway into the contract. Along with another check, when a user attempts to join a season, their buy in amount must match this value.
- `i_factory` is an immutable address which is sent when the contract is created. It is the address of the `FactoryContract`.
- `s_prizePool` is incremented each time a user buys in to the league. It is used to track funds making distribution easier.
- `players` is a mapping that maps a user's address with a `Player` struct. The `Player` struct contains important information about each user.
```solidity
 struct Player {
    bool whitelisted;
    bool buyInPaid;
    uint winnings;
}
```
- `whitelisted` is a boolean that is set to true when a commissioner enables a user to join the league. In `Version 1.0`, there was a mapping called `whitelist` which served the purpose of storing addresses that were allowed to join the league. In `Version 2.0`, this is simplified into a boolean value. The `whitelisted` boolean ensures only the players in this league can interact with the functions of the `Fantasy` contract.
- `buyInPaid` is another boolean value that becomes true when a user successfully buys in to the league.
- `winnings` is a uint that keeps track of how much the player is allowed to withdraw. This is a value that will be adjusted by the commissioner.

##### Modifiers
`Fantasy.sol` has two important modifiers.
The `onlyWhitelisted` modifier ensures that only players invited to the league can interact with the contract.
```solidity
modifier onlyWhitelisted(address _address) {
    if (!players[_address].whitelisted) {
        revert Fantasy__AddressNotWhitelisted();
    }
    _;
}
```
The modifier takes an address as an argument. The modifier takes the address and uses it as a key in the `s_players` mapping. The function verifies that the address returns true for the `whitelisted` parameter.

The `onlyCommissioner` modifier ensures only the commissioner can call certain functions.
```solidity
modifier onlyCommissioner() {
	if (msg.sender != i_commissioner) {
		revert Fantasy__OnlyCommissionerCanPerformThisAction();
	}
	_;
}
```
The `i_commissioner` variable is assigned when the `Fantasy` contract is deployed. This variable is used to compare with `msg.sender` to ensure only the commissioner can interact with certain functions.

##### Constructor
The `constructor` for `Fantasy.sol` is integral in setting the unique parameters for each contract that is deployed by `FantasyFactory`.  
```solidity
constructor(
        address _commissioner,
        uint256 _seasonId,
        uint256 _buyIn,
        address _factory
    ) {
        i_seasonId = _seasonId;
        i_commissioner = _commissioner;
        i_buyIn = _buyIn;
        i_factory = _factory;

        s_players[_commissioner].whitelisted = true;
        emit SeasonStarted(_seasonId, _commissioner);
        emit Whitelisted(_seasonId, _commissioner);
    }
```
The constructor has 4 parameters:
- `_commissioner` is an address that dictates the ownership of the deployed `Fantasy` contract
- `_seasonId` is the unique uint256 identifier assigned to this contract which is based on the season counter in `FantasyFactory.sol`
- `_buyIn` is the amount that whitelisted members must pay to join the league
- `_iFactory` is the contract address of `FantasyFactory.sol` which is used in the function to complete the season
When a new contract is created with `FantasyFactory.sol`, this constructor is provided with the necessary arguments. So launching a new contract from `FantasyFactory.sol` will assign a commissioner, provide a season id, set the buy in, and store the `FantasyFactory.sol` contract address.  Additionally, the commissioner's address will be whitelisted allowing the commissioner to buy in.

##### `addToWhiteList`
The first function important to the `Fantasy` contract is the `addToWhitelist` function:
```solidity
function addToWhitelist(address _address) external onlyCommissioner {
    if (s_players[_address].whitelisted) {
        revert Fantasy__AddressAlreadyWhitelisted();
    }
    s_players[_address].whitelisted = true;
    emit Whitelisted(i_seasonId, _address);
}
```
- This function can only be called by the `commissioner`
- The function has one parameter, an address
    - The address that the commissioner will input through the frontend will be the address of the user that is to be whitelisted
- If the address is already whitelisted, this function will rever
- The address is added to the `s_players` mapping, setting the `whitelisted` boolean found in the `Player` struct to true
- The whitelisted address now has access to certain functions in the `Fantasy` contract
    - The whitelisted address will only have access to the specific contract associated with the `commissioner`

##### `buyIn`
The `buyIn` function allows whitelisted addresses to pay the buy in fee for the league
```
function buyIn(uint _buyIn) external payable onlyWhitelisted(msg.sender) {
        Player storage player = s_players[msg.sender];
        if (_buyIn != i_buyIn || _buyIn <= 0) {
            revert Fantasy__IncorrectBuyInAmount();
        }
        if (player.buyInPaid) {
            revert Fantasy__PlayerAlreadyPaid();
        }

        player.buyInPaid = true;
        s_prizePool += _buyIn;
        
        emit PlayerBuyIn(msg.sender, _buyIn);
    }
```
- The function has one argument `_buyIn`: the buy in amount 
- This function can only be called by whitelisted addresses
- If the buy in amount used as an argument does not match with the `i_buyIn` variable or if the buy in is 0, this function will revert
- The the address calling this function has already paid the buy in, this function will revert
- When this function is called successfully: 
	- The `buyInPaid` boolean in the `Player` struct associated with the address calling this function will be set to true
	- `s_prizepool` will be incremented with the `_buyIn` amount

##### `addWinnings`
The `addWinnings` function allows the commissioner to distribute funds to players in the league.  This can be done at any point in during the duration of the contract.  
```
    function addWinnings(
        address _player,
        uint _winnings
    ) external onlyCommissioner {
        Player storage player = s_players[_player];

        if (!player.whitelisted) {
            revert Fantasy__PlayerNotInLeague();
        }
        if (!player.buyInPaid) {
            revert Fantasy__PlayerDidNotPayBuyIn();
        }
        if (_winnings > s_prizePool) {
            revert Fantasy__ExceedsPrizePool();
        }

        player.winnings += _winnings;
        s_prizePool -= _winnings;

        emit AddedWinning(_player, _winnings);
    }
```
- The function takes two arguments and address and a uint
	- Funds will be added to the `_player` address
	- `_winnings` is the amount to be added
- If the commissioner attempts to add winnings to an address that isn't whitelisted, the function will revert.
- If a player is whitelisted, but the buy in has yet to be paid, the commissioner cannot add winnings for the player.
- If the amount being added is greater than the current prizepool, the function will revert
- When this function is called successfully:
	- The `Player` struct winning key is incremented. 
	- The `prizePool` is decremented by the same amount

##### `withdrawWinnings`
As the commissioner distributes the prizepool to the players, a player is free to withdraw their funds as they choose.  This is handled by the `withdrawWinnings` function:
```
 function withdrawWinnings() external payable onlyWhitelisted(msg.sender) {
	Player storage player = s_players[msg.sender];
	uint256 winnings = player.winnings;

	if (winnings <= 0) {
		revert Fantasy__NoWinningsToWithdraw();
	}
	
	player.winnings = 0;

	(bool success, ) = msg.sender.call{value: winnings}("");
	if (!success) {
		revert Fantasy__FailedToSendWinnings();
	}

	emit PlayerWithdraw(msg.sender, winnings);
}
```
- The function does not take any arguments
- The function is payable, so it can transfer ether
- The function has the `onlyWhitelisted` modifier attached to it.
	- While the modifier isn't absolutely necessary as there are further checks, it still ensures only players in this specific league can successfully call this function
- If a player attempts to call this function while there are no winnings associated with the player, this function will revert
	- This check is made using `msg.sender` and checking the `s_players` mapping
	- Because `msg.sender` must be located in the `s_players` mapping, there should be no worries of malicious addresses making calls 
	- A player attempting to act maliciously will only be able to withdraw funds associated with their address
- When this function is successfully called, the player winnings will be set to 0 to ensure multiple calls cannot be made
- This function will transfer the winning value in ether to `msg.sender`

##### `tipCommissioner`
The owner of the Fantasy contract will have to spend some gas in order to get the season started. For this reason, there is an option for players in the league to send a tip to the commissioner:
```
    function tipCommisioner() external payable onlyWhitelisted(msg.sender) {
        uint256 minValue = 0.001 ether;
        if (msg.value < minValue) {
            revert Fantasy__TipTooSmall();
        }

        (bool success, ) = i_commissioner.call{value: msg.value}("");
        if (!success) {
            revert Fantasy__FailedToSendTip();
        }

        emit TippedCommissioner(msg.sender, msg.value);
    }
```
- Only whitelisted members of the league can call this function
	- This limitation is not absolutely necessary. 
	- The step was taken to ensure only members that have been invited to a league can interact with that specific contract.
- A minimum value of 0.001 ether is required

##### `completeSeason`
This function allows a commissioner to "complete" a season after funds have been distributed.  This isn't absolutely necessary, it's just a way to clean up the `s_fantasyContracts` function in `FantasyFactory.sol`
```
function completeSeason() external onlyCommissioner {
	if (s_seasonComplete) {
		revert Fantasy__SeasonAlreadyComplete();
	}

	if (address(this).balance != 0) {
		revert Fantasy__PlayersStillNeedToWithdraw();
	}

	s_seasonComplete = true;
	FantasyFactory factory = FantasyFactory(i_factory);
	factory.removeFantasyContract(msg.sender, i_seasonId);

	emit SeasonCompleted(i_seasonId, msg.sender);
}
```
- Only the commissioner can call this function
- If the season is already complete,  this function will revert
- If the contract still has a balance, this function will revert
- When this function is successfully called:
	- `s_seasonComplete` boolean is set to true
	- `i_factory` is used to make a call to the `FantasyFactory` contract
	- `removeFantasyContract` is called sending two arguments
		- `msg.sender` is the commissioner's address which will be used in the `s_fantasyContracts` mapping
		- `i_seasonId` is used to send the season id

</details>

<details>
<summary> Version 1.0 </summary>

## Verson 1.0
This was the original smart contract. It has been updated to 2.0.
### How does it work?
Anyone can interact with this contract to deploy a season. The person interacting with the contract becomes the commissioner of the season they deployed.  The commissioner can allow other players to join their season. Everyone that's allowed to join buys in, and the smart contract holds all the funds.  The commissioner distributes the funds to the players and the players can withdraw at any point.  

### The smart contract
A ``seasons`` array keeps track of the all the seasons that have been created.
```solidity
Season[] public seasons;
```
The heart of the contract lies in the ``Season`` struct.
```solidity
struct Season {
    uint id;
    address payable commissioner;
    mapping(address => bool) whitelist;
    mapping(address => Player) players;
    uint buyIn;
    uint prizePool;
    bool distributed;
    bool complete;
}
``` 
This custom data structure keeps track off all the important details associated with a season. It contains information that includes the season id, the commissioner, a mapping of whitelisted players that are allowed to join the league, a mapping of players that have joined the league, the buy in amount, the total prize pool, whether all funds have been distributed, and whether the season has been completed.

Another key component of the contract is the ``Player`` struct.
```solidity
struct Player {
    address payable id;
    bool paid;
    uint winnings;
}
```
When a player buys in to a league, a ``Player`` struct is created . This struct contains the player's address, a variable confirming that they have paid, and a variable to track their winnings. A mapping of ``Player`` structs is contained within the ``Season`` struct.

</details>