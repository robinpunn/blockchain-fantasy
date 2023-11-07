// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Fantasy} from "./Fantasy.sol";

contract FantasyFactory {
    ////////////////////////
    // State Variables  ///
    ///////////////////////
    uint256 private s_seasonCounter;
    /**
     * @notice owner key mapped to deployed contract
     * @dev the createFantasyContract() function will update this mapping when executed
     * the owner address will be the key that points to the fantasy address which will point to the season id
     */
    mapping(address owner => mapping(uint256 seasonId => Season createdSeason))
        private s_fantasyContracts;

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

    /////////////////
    // Functions  ///
    /////////////////
    /**
     * @notice a function to deploy a contract
     * @dev this function deploy a fantasy contract with the caller as the commissioner
     * @param _buyIn sets the buy in for the newly created season
     */
    function createFantasyContract(uint256 _buyIn) external {
        uint256 currentId = s_seasonCounter;

        Fantasy newFantasyContract = new Fantasy(
            payable(msg.sender),
            currentId,
            _buyIn
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

    ////////////////////////
    // Getter Functions  ///
    ////////////////////////

    function getFantasyContract(
        uint256 _seasonId
    ) external view returns (address) {
        return s_fantasyContracts[msg.sender][_seasonId].fantasyContract;
    }

    function getBuyIn(uint256 _seasonId) external view returns (uint256) {
        return s_fantasyContracts[msg.sender][_seasonId].buyIn;
    }

    function getSeasonCounter() external view returns (uint256) {
        return s_seasonCounter;
    }
}
