# Blockchain Fantasy
This was created as a final project for Alchemy University's Ethereum Bootcamp.

### What is this?
The is a Solidity smart contract that handles payments for fantasy sports leagues.

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