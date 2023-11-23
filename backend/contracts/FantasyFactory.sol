// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Fantasy} from "./Fantasy.sol";

contract FantasyFactory {
    //////////////
    // Errors  ///
    //////////////
    error Fantasy_Factory__InvalidBuyInAmount();
    error Fantasy_Factory__ContractDoesNotExist();
    error Fantasy_Factory__MustCallFromContract();

    ////////////////////////
    // State Variables  ///
    ///////////////////////
    uint256 private s_seasonCounter;
    /**
     * @notice owner key mapped to deployed contract
     * @dev the createFantasyContract() function will update this mapping when executed
     * the owner address will be the key that points to the uint256 season id, which will point to the Season struct
     */
    mapping(address owner => mapping(uint256 seasonId => Season createdSeason))
        private s_fantasyContracts;

    /**
     * @notice Season struct for each fantasy contract that gets deployed
     * @dev the createFantasyContract() function will use the Season struct to add the contract address and the buy in amount
     * the Season struct will be added to the s_fantasyContracts mapping to be associated with the contract deployer and season id
     * the reason id isn't included in the struct is to allow easier searching if a user creates multiple leagues
     */
    struct Season {
        address fantasyContract;
        uint256 buyIn;
    }

    ///////////////
    // Events  ///
    //////////////
    event FantasyContractCreation(
        address indexed fantasyContract,
        address indexed owner,
        uint256 indexed seasonId
    );

    event ContractRemoved(
        address indexed fantasyContract,
        uint256 indexed seasonId,
        address indexed owner
    );

    /////////////////
    // Functions  ///
    /////////////////
    /**
     * @notice a function to deploy a fantasy contract
     * @dev this function deploys a fantasy contract with the caller set as the commissioner
     * @param _buyIn sets the buy in for the newly created season, must be > 0
     * creates a new Fantasy contract using three parameters required by the Fantasy constructor
     * msg.sender is passed to the Fantasy contract to be set as the commissioner
     * the current value of s_seasonCounter is passed to the Fantasy contract to establish the season id
     * the _buyIn parameter sets passes the buy in to the Fantasy constructor
     * s_fantasyContracts is updated with the three parameters mentioned above
     * s_seasonCounter increments, to be used by the next contract that is deployed
     */
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

    /**
     * @notice a function to remove a contract from the s_fantasyContracts mapping
     * @dev msg.sender is going to be a contract address
     * @param _owner address that created the msg.sender contract
     * @param _seasonId season id of the msg.sender contract
     * removes a new Fantasy contract from the mapping when the commisioner decides to end the season
     * the commisioner will call this function from the msg.sender contract
     */
    function removeFantasyContract(address _owner, uint256 _seasonId) external {
        if (
            msg.sender != s_fantasyContracts[_owner][_seasonId].fantasyContract
        ) {
            revert Fantasy_Factory__MustCallFromContract();
        }
        delete s_fantasyContracts[_owner][_seasonId];

        emit ContractRemoved(msg.sender, _seasonId, _owner);
    }

    ////////////////////////
    // Getter Functions  ///
    ////////////////////////
    /**
     * @notice a function to retreive a contract that has been deployed by msg.sender
     * @param _seasonId the s_seasonCounter value that was used when the contract was created
     * @dev this function will check s_fantasyContracts with msg.sender and _seasonId
     * will return a contract address of a deployed contract if it exits
     */
    function getFantasyContract(
        uint256 _seasonId
    ) external view returns (address) {
        address fantasyContract = s_fantasyContracts[msg.sender][_seasonId]
            .fantasyContract;
        if (fantasyContract == address(0)) {
            revert Fantasy_Factory__ContractDoesNotExist();
        }
        return fantasyContract;
    }

    /**
     * @notice a function retreive the buy in for a contract that has been deployed by msg.sender
     * @param _seasonId the s_seasonCounter value that was used when the contract was created
     * @dev this function will check s_fantasyContracts with msg.sender and _seasonId
     * returns the buy in amount if a deployed contract exits
     */
    function getBuyIn(uint256 _seasonId) external view returns (uint256) {
        uint256 buyIn = s_fantasyContracts[msg.sender][_seasonId].buyIn;
        if (buyIn == 0) {
            revert Fantasy_Factory__ContractDoesNotExist();
        }
        return buyIn;
    }

    /**
     * @notice a function that returns the current value of _seasonCounter
     * @dev _seasonCounter increments when a new contract is deployed
     */
    function getSeasonCounter() external view returns (uint256) {
        return s_seasonCounter;
    }
}
