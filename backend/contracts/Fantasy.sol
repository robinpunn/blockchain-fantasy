// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FantasyFactory} from "./FantasyFactory.sol";

contract Fantasy {
    //////////////
    // Errors  ///
    //////////////
    error Fantasy__AddressNotWhitelisted();
    error Fantasy__OnlyCommissionerCanPerformThisAction();
    error Fantasy__AddressAlreadyWhitelisted();
    error Fantasy__IncorrectBuyInAmount();
    error Fantasy__PlayerAlreadyPaid();
    error Fantasy__FailedToBuyIn();
    error Fantasy__PlayerNotInLeague();
    error Fantasy__PlayerDidNotPayBuyIn();
    error Fantasy__ExceedsPrizePool();
    error Fantasy__NoWinningsToWithdraw();
    error Fantasy__FailedToSendWinnings();
    error Fantasy__TipTooSmall();
    error Fantasy__FailedToSendTip();
    error Fantasy__SeasonIsAlreadyComplete();
    error Fantasy__SeasonAlreadyComplete();
    error Fantasy__PlayersStillNeedToWithdraw();

    ////////////////////////
    // State Variables  ///
    ///////////////////////
    /**
     * @notice boolean that tracks whether or not season has been completed
     */
    bool private s_seasonComplete;

    /**
     * @notice season id based on seasonCounter from factory contract
     */
    uint256 private immutable i_seasonId;

    /**
     * @notice address that interacted with createFantasyContract
     */
    address private immutable i_commissioner;

    /**
     * @notice address that interacted with createFantasyContract
     */
    uint256 private immutable i_buyIn;

    /**
     * @notice address of the factory contract that deployed this contract
     */
    address private immutable i_factory;

    /**
     * @notice address that interacted with createFantasyContract
     */
    uint256 private s_prizePool;

    /**
     * @notice mapping that tracks addresses that are allowed to buy in
     */
    mapping(address playerAddress => Player playerStruct) s_players;

    /**
     * @notice Player struct
     * @dev tracks address, bool on whether they were paid their winnings, and the amount of winnings
     */
    struct Player {
        bool whitelisted;
        bool buyInPaid;
        uint winnings;
    }

    ///////////////
    // Events  ///
    //////////////
    /**
     * @notice Event when season is started indexing season id and commissioner address
     */
    event SeasonStarted(uint indexed seasonId, address indexed commissioner);
    /**
     * @notice Event emitted when a player is added to the whitelist
     */
    event Whitelisted(uint indexed seasonId, address indexed member);
    /**
     * @notice Event emitted when player joins the league
     */
    event PlayerBuyIn(address indexed member, uint256 buyIn);
    /**
     * @notice Event emitted when commissioner adds winnings for a player
     */
    event AddedWinning(address indexed member, uint256 indexed winningAmount);
    /**
     * @notice Event emitted when player withdraws their funds
     */
    event PlayerWithdraw(
        address indexed member,
        uint256 indexed withdrawAmount
    );
    /**
     * @notice Event emitted when the commissioner is tipped indexing season id and tipper
     */
    event TippedCommissioner(address indexed member, uint256 indexed amount);
    /**
     * @notice Event when season is completed indexing season id and commissioner
     */
    event SeasonCompleted(uint indexed seasonId, address indexed commisioner);

    /////////////////
    // modifiers ///
    ////////////////
    /**
     * @notice a function to check if player is on the season whitelist
     * @dev this modifier will be used for functions that should only be accessible to whitelisted players
     * @param _address address to whitelist
     */
    modifier onlyWhitelisted(address _address) {
        if (!s_players[_address].whitelisted) {
            revert Fantasy__AddressNotWhitelisted();
        }
        _;
    }
    /**
     * @notice a function to add player to season whitelist
     * @dev this function will check if the provided address is in the whitelist mapping and revert if so
     */
    modifier onlyCommissioner() {
        if (msg.sender != i_commissioner) {
            revert Fantasy__OnlyCommissionerCanPerformThisAction();
        }
        _;
    }

    ///////////////////
    // constructor ///
    //////////////////
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

    ////////////////
    // Fallback  ///
    ////////////////
    receive() external payable {}

    fallback() external payable {}

    /////////////////
    // Functions  ///
    /////////////////
    /**
     * @notice a function to add player to season whitelist
     * @dev only the commissioner can call this function with the corresponding season id
     * @param _address id for the address to be whitelisted
     * adds provided address to the whitelist mapping
     * reverts if season id doesn't exist
     * reverts if address is already whitelisted
     */
    function addToWhitelist(address _address) external onlyCommissioner {
        if (s_players[_address].whitelisted) {
            revert Fantasy__AddressAlreadyWhitelisted();
        }
        s_players[_address].whitelisted = true;
        emit Whitelisted(i_seasonId, _address);
    }

    /**
     * @notice a function to allow players to buy in
     * @dev only whitelisted players with the corresponding seawson id can call this function
     * @param _buyIn the buy in amount for the season
     * reverts if season id doesn't exist
     * reverts for incorrect buy in amounts
     * reverts if season has already bought in
     * uses player struct to set address as id, set paid bool to true, and increment season prizepool
     */
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

    /**
     * @notice a function to add winnings for a player
     * @dev only the commissioner can call this function with the corresponding season id
     * @param _player address for the player being given winnings
     * @param _winnings the amount being given to _player
     * reverts if season id doesn't exist
     * reverts if player address isn't in the players mapping
     * the winnings uint is incremented for the corresponding player and the winning amount is decremented from the season prizepool
     */
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

    /**
     * @notice a function to withdraw funds
     * @dev anyone can call this function
     * checks if msg.sender matches a player.id in the players mapping
     * reverts if season id doesn't exist
     * reverts if player id doesn't match msg.sender
     * reverts if there are no winnings to withdraw
     * sends the winning amount corresponding to the withdrawing address
     */
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

    /**
     * @notice a function to allow whitelisted players to tip the commissioner
     * @dev only players whitelisted to this season can tip
     */
    function tipCommissioner() external payable onlyWhitelisted(msg.sender) {
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

    /**
     * @notice a function to complete the season
     * @dev only the commissioner can call this function with the corresponding season id
     * reverts if there are still funds to be withdrawn
     * calls the remove contract function in FantasyFactory
     */
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

    ////////////////////////
    // Getter Functions  ///
    ////////////////////////
    function getSeasonStatus() external view returns (bool) {
        return s_seasonComplete;
    }

    function getSeasonId() external view returns (uint256) {
        return i_seasonId;
    }

    function getBuyInAmount() external view returns (uint256) {
        return i_buyIn;
    }

    function getSeasonCommissioner() external view returns (address) {
        return i_commissioner;
    }

    function getSeasonPrizePool() external view returns (uint256) {
        return s_prizePool;
    }

    function getWhiteListedMember(
        address _member
    ) external view returns (bool) {
        return s_players[_member].whitelisted;
    }

    function getBuyInStatus(address _member) external view returns (bool) {
        return s_players[_member].buyInPaid;
    }

    function getSeasonWinnings() external view returns (uint) {
        return s_players[msg.sender].winnings;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    function getFactory() external view returns (address) {
        return i_factory;
    }
}
