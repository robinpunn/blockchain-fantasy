// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Fantasy {
    //////////////
    // Errors  ///
    //////////////
    error Fantasy__AddressNotWhitelisted();
    error Fantasy__OnlyCommissionerCanPerformThisAction();
    error Fantasy__AddressAlreadyWhitelisted();
    error Fantasy__SeasonDoesNotExist();
    error Fantasy__CannotWithdrawOtherUsersFunds();
    error Fantasy__IncorrectBuyInAmount();
    error Fantasy__PlayerAlreadyJoined();
    error Fantasy__PlayerNotInLeague();
    error Fantasy__NoWinningsToWithdraw();
    error Fantasy__FailedToSendWinnings();
    error Fantasy__FailedToSendTip();
    error Fantasy__SeasonIsAlreadyComplete();
    error Fantasy__PlayersStillNeedToWithdraw();

    ////////////////////////
    // State Variables  ///
    ///////////////////////
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
     * @notice address that interacted with createFantasyContract
     */
    uint256 private s_prizePool;

    /**
     * @notice mapping that tracks addresses that are allowed to buy in
     */
    mapping(address => Player) players;

    /**
     * @notice an array populated with Season structs
     */
    Season[] public seasons;

    /**
     * @notice Player struct
     * @dev tracks address, bool on whether they were paid their winnings, and the amount of winnings
     */
    struct Player {
        bool whitelisted;
        bool buyInPaid;
        uint winnings;
    }

    /**
     * @notice season struct
     * @dev the id is based on the season counter
     * tracks the commisioner, a mapping of whitelisted players, a mapping of players
     * tracks the buy in, prize pool, whether or not funds were distributed, whether commisioner set the season as complete
     */
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
    event MemberJoined(uint indexed seasonId, address indexed member);
    /**
     * @notice Event emitted when commissioner adds winnings to a player address indexing season id, player, and amount added
     */
    event PlayerWin(
        uint indexed seasonId,
        address indexed member,
        uint indexed addedWinning
    );
    /**
     * @notice Event emitted when the commissioner is tipped indexing season id and tipper
     */
    event TippedCommissioner(uint indexed seasonId, address indexed member);
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
        if (!players[_address].whitelisted) {
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

    constructor(address _commissioner, uint256 _seasonId, uint256 _buyIn) {
        i_seasonId = _seasonId;
        i_commissioner = _commissioner;
        i_buyIn = _buyIn;
        // Season storage newSeason = seasons.push();
        // newSeason.id = _seasonId;
        // newSeason.buyIn = _buyIn;
        // newSeason.commissioner = payable(_commissioner);
        players[_commissioner].whitelisted = true;
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
        if (players[_address].whitelisted) {
            revert Fantasy__AddressAlreadyWhitelisted();
        }
        players[_address].whitelisted = true;
        emit Whitelisted(i_seasonId, _address);
    }

    /**
     * @notice a function to remove a player from whitelist if needed
     * @dev only the commissioner can call this function with the corresponding season id
     * @param _seasonId id for the season being updated
     * @param _address id for the address to be removed from whitelist
     * removes provided address from the whitelist mapping
     */
    function removeFromWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner onlyWhitelisted(_address) {
        delete seasons[_seasonId].whitelist[_address];
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
        Player storage player = players[msg.sender];
        if (_buyIn != i_buyIn || _buyIn <= 0) {
            revert Fantasy__IncorrectBuyInAmount();
        }
        if (player.buyInPaid) {
            revert Fantasy__PlayerAlreadyJoined();
        }

        player.buyInPaid = true;
        s_prizePool += _buyIn;

        emit MemberJoined(i_seasonId, msg.sender);
    }

    /**
     * @notice a function to add winnings for a player
     * @dev only the commissioner can call this function with the corresponding season id
     * @param _seasonId id for the season being updated
     * @param _player address for the player being given winnings
     * @param _winnings the amount being given to _player
     * reverts if season id doesn't exist
     * reverts if player address isn't in the players mapping
     * the winnings uint is incremented for the corresponding player and the winning amount is decremented from the season prizepool
     */
    function addWinnings(
        uint _seasonId,
        address _player,
        uint _winnings
    ) external onlyCommissioner {
        Season storage season = seasons[_seasonId];
        Player storage player = season.players[_player];
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        if (player.id == address(0)) {
            revert Fantasy__PlayerNotInLeague();
        }

        player.winnings += _winnings;
        season.prizePool -= _winnings;

        emit PlayerWin(_seasonId, _player, _winnings);
    }

    /**
     * @notice a function to withdraw funds
     * @dev anyone can call this function
     * @param _seasonId id for the season being updated
     * checks if msg.sender matches a player.id in the players mapping
     * reverts if season id doesn't exist
     * reverts if player id doesn't match msg.sender
     * reverts if there are no winnings to withdraw
     * sends the winning amount corresponding to the withdrawing address
     */
    function withdrawWinnings(uint _seasonId) external {
        Season storage season = seasons[_seasonId];
        Player storage player = season.players[msg.sender];
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        if (player.id != msg.sender) {
            revert Fantasy__CannotWithdrawOtherUsersFunds();
        }
        uint winnings = player.winnings;
        if (winnings <= 0) {
            revert Fantasy__NoWinningsToWithdraw();
        }

        (bool success, ) = msg.sender.call{value: winnings}("");
        if (!success) {
            revert Fantasy__FailedToSendWinnings();
        } else {
            player.winnings = 0;
        }

        emit PlayerWin(_seasonId, msg.sender, winnings);
    }

    /**
     * @notice a function to allow whitelisted players to tip the commissioner
     * @dev only players whitelisted to this season can tip
     * @param _seasonId id for the season being updated
     * @param _amount the amount to be tipped
     * reverts if season id doesn't exist
     */
    function tipCommisioner(
        uint _seasonId,
        uint _amount
    ) external payable onlyWhitelisted(msg.sender) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        (bool success, ) = seasons[_seasonId].commissioner.call{value: _amount}(
            ""
        );
        if (!success) {
            revert Fantasy__FailedToSendTip();
        }

        emit TippedCommissioner(_seasonId, msg.sender);
    }

    /**
     * @notice a function to complete the season
     * @dev only the commissioner can call this function with the corresponding season id
     * @param _seasonId id for the season being updated
     * reverts if season id doesn't exist
     * reverts if season is already completed
     * reverts if the prize pool is not 0
     * sets the seasonComplete bool to true
     */
    function completeSeason(uint _seasonId) external onlyCommissioner {
        Season storage season = seasons[_seasonId];

        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        if (season.complete) {
            revert Fantasy__SeasonIsAlreadyComplete();
        }
        if (season.prizePool != 0) {
            revert Fantasy__PlayersStillNeedToWithdraw();
        }

        season.complete = true;

        emit SeasonCompleted(_seasonId, msg.sender);
    }

    ////////////////////////
    // Getter Functions  ///
    ////////////////////////
    function getSeasonPrizePool(uint _seasonId) external view returns (uint) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        return seasons[_seasonId].prizePool;
    }

    function getBuyInAmount(uint _seasonId) external view returns (uint) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        return seasons[_seasonId].buyIn;
    }

    function getSeasonCommissioner(
        uint _seasonId
    ) external view returns (address) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        return seasons[_seasonId].commissioner;
    }

    function getWhiteListedMember(
        uint _seasonId,
        address _member
    ) external view returns (bool) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        return seasons[_seasonId].whitelist[_member];
    }

    function getPlayer(
        uint _seasonId,
        address _member
    ) external view returns (bool) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        if (seasons[_seasonId].players[_member].id == _member) {
            return true;
        }
        return false;
    }

    function getSeasonWinnings(uint _seasonId) external view returns (uint) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert Fantasy__SeasonDoesNotExist();
        }
        return seasons[_seasonId].players[msg.sender].winnings;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
