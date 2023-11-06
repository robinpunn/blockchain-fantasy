// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Fantasy {
    //////////////
    // Errors  ///
    //////////////
    error AddressNotWhitelisted();
    error OnlyCommissionerCanPerformThisAction();
    error AddressAlreadyWhitelisted();
    error SeasonDoesNotExist();
    error CannotWithdrawOtherUsersFunds();
    error IncorrectBuyInAmount();
    error PlayerAlreadyJoined();
    error PlayerNotInLeague();
    error NoWinningsToWithdraw();
    error FailedToSendWinnings();
    error FailedToSendTip();
    error SeasonIsAlreadyComplete();
    error PlayersStillNeedToWithdraw();

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
    mapping(address => bool) whitelist;

    /**
     * @notice an array populated with Season structs
     */
    Season[] public seasons;

    /**
     * @notice Player struct
     * @dev tracks address, bool on whether they were paid their winnings, and the amount of winnings
     */
    struct Player {
        address payable id;
        bool paid;
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
        if (!whitelist[_address]) {
            revert AddressNotWhitelisted();
        }
        _;
    }
    /**
     * @notice a function to add player to season whitelist
     * @dev this function will check if the provided address is in the whitelist mapping and revert if so
     */
    modifier onlyCommissioner() {
        if (msg.sender != i_commissioner) {
            revert OnlyCommissionerCanPerformThisAction();
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
        whitelist[_commissioner] = true;
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
     * @notice a function to create a new season
     * @dev anyone can call this function in order to start a new season
     * @param _buyIn sets the buy in players will have to pay when joining the season
     * adds a new season to the seasons array
     * uses season counter to set id for the season
     * the msg.sender becomes the season commissioner
     * the msg.sender is added to the whitelist
     * the season counter increments
     */
    function addSeason(uint _buyIn) external {}

    /**
     * @notice a function to add player to season whitelist
     * @dev only the commissioner can call this function with the corresponding season id
     * @param _seasonId id for the season being updated
     * @param _address id for the address to be whitelisted
     * adds provided address to the whitelist mapping
     * reverts if season id doesn't exist
     * reverts if address is already whitelisted
     */
    function addToWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        if (seasons[_seasonId].whitelist[_address]) {
            revert AddressAlreadyWhitelisted();
        }
        seasons[_seasonId].whitelist[_address] = true;
        emit Whitelisted(_seasonId, _address);
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
    ) external onlyCommissioner {
        delete seasons[_seasonId].whitelist[_address];
    }

    /**
     * @notice a function to allow players to buy in
     * @dev only whitelisted players with the corresponding seawson id can call this function
     * @param _seasonId id for the season being updated
     * @param _buyIn the buy in amount for the season
     * reverts if season id doesn't exist
     * reverts for incorrect buy in amounts
     * reverts if season has already bought in
     * uses player struct to set address as id, set paid bool to true, and increment season prizepool
     */
    function buyIn(
        uint _seasonId,
        uint _buyIn
    ) external payable onlyWhitelisted(msg.sender) {
        Season storage season = seasons[_seasonId];
        Player storage player = season.players[msg.sender];

        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        if (_buyIn != season.buyIn || _buyIn <= 0) {
            revert IncorrectBuyInAmount();
        }
        if (player.id != address(0)) {
            revert PlayerAlreadyJoined();
        }

        player.id = payable(msg.sender);
        player.paid = true;
        season.prizePool += _buyIn;

        emit MemberJoined(_seasonId, msg.sender);
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
            revert SeasonDoesNotExist();
        }
        if (player.id == address(0)) {
            revert PlayerNotInLeague();
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
            revert SeasonDoesNotExist();
        }
        if (player.id != msg.sender) {
            revert CannotWithdrawOtherUsersFunds();
        }
        uint winnings = player.winnings;
        if (winnings <= 0) {
            revert NoWinningsToWithdraw();
        }

        (bool success, ) = msg.sender.call{value: winnings}("");
        if (!success) {
            revert FailedToSendWinnings();
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
            revert SeasonDoesNotExist();
        }
        (bool success, ) = seasons[_seasonId].commissioner.call{value: _amount}(
            ""
        );
        if (!success) {
            revert FailedToSendTip();
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
            revert SeasonDoesNotExist();
        }
        if (season.complete) {
            revert SeasonIsAlreadyComplete();
        }
        if (season.prizePool != 0) {
            revert PlayersStillNeedToWithdraw();
        }

        season.complete = true;

        emit SeasonCompleted(_seasonId, msg.sender);
    }

    ////////////////////////
    // Getter Functions  ///
    ////////////////////////
    function getSeasonPrizePool(uint _seasonId) external view returns (uint) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].prizePool;
    }

    function getBuyInAmount(uint _seasonId) external view returns (uint) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].buyIn;
    }

    function getSeasonCommissioner(
        uint _seasonId
    ) external view returns (address) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].commissioner;
    }

    function getWhiteListedMember(
        uint _seasonId,
        address _member
    ) external view returns (bool) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].whitelist[_member];
    }

    function getPlayer(
        uint _seasonId,
        address _member
    ) external view returns (bool) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        if (seasons[_seasonId].players[_member].id == _member) {
            return true;
        }
        return false;
    }

    function getSeasonWinnings(uint _seasonId) external view returns (uint) {
        if (_seasonId < 0 || _seasonId >= i_seasonId) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].players[msg.sender].winnings;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
