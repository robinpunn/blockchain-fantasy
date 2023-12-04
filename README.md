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