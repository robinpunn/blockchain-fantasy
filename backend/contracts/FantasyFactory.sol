// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Fantasy} from "./Fantasy.sol";

contract FantasyFactory {
    ////////////////////////
    // State Variables  ///
    ///////////////////////
    uint private s_seasonCounter;
    /**
     * @notice owner key mapped to deployed contract
     * @dev the createFantasyContract() function will update this mapping when executed
     * the owner address will be the key that points to the fantasy address which will point to the season id
     */
    mapping(address owner mapping( address fantasyContract => uint256 seasonId))
        private s_fantasyContracts;

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
     */
    function createFantasyContract(uint256 _buyIn) external {
        Fantasy newFantasyContract = new Fantasy(
            payable(msg.sender),
            s_seasonCounter,
            _buyIn
        );
        s_fantasyContracts[msg.sender][address(newFantasyContract)] = s_seasonCounter;
        s_seasonCounter++;
    }
}
