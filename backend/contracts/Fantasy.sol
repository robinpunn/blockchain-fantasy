// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Fantasy {
    /** Errors */
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

    uint public seasonCounter;
    Season[] public seasons;

    struct Player {
        address payable id;
        bool paid;
        uint winnings;
    }

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

    event SeasonStarted(uint indexed seasonId, address indexed commissioner);
    event Whitelisted(uint indexed seasonId, address indexed member);
    event MemberJoined(uint indexed seasonId, address indexed member);
    event PlayerWin(
        uint indexed seasonId,
        address indexed member,
        uint indexed addedWinning
    );
    event TippedCommissioner(uint indexed seasonId, address indexed member);
    event SeasonCompleted(uint indexed seasonId, address indexed commisioner);

    modifier onlyWhitelisted(uint _seasonId, address _address) {
        if (!seasons[_seasonId].whitelist[_address]) {
            revert AddressNotWhitelisted();
        }
        _;
    }
    modifier onlyCommissioner(uint _seasonId) {
        if (msg.sender != seasons[_seasonId].commissioner) {
            revert OnlyCommissionerCanPerformThisAction();
        }
        _;
    }

    function addSeason(uint _buyIn) external {
        uint newSeasonId = seasonCounter;
        Season storage newSeason = seasons.push();
        newSeason.id = newSeasonId;
        newSeason.buyIn = _buyIn;
        newSeason.commissioner = payable(msg.sender);
        newSeason.whitelist[msg.sender] = true;
        seasonCounter++;
        emit SeasonStarted(newSeasonId, msg.sender);
        emit Whitelisted(newSeasonId, msg.sender);
    }

    function addToWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner(_seasonId) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        if (seasons[_seasonId].whitelist[_address]) {
            revert AddressAlreadyWhitelisted();
        }
        seasons[_seasonId].whitelist[_address] = true;
        emit Whitelisted(_seasonId, _address);
    }

    function removeFromWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner(_seasonId) {
        delete seasons[_seasonId].whitelist[_address];
    }

    function buyIn(
        uint _seasonId,
        uint _buyIn
    ) external payable onlyWhitelisted(_seasonId, msg.sender) {
        Season storage season = seasons[_seasonId];
        Player storage player = season.players[msg.sender];

        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
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

    function addWinnings(
        uint _seasonId,
        address _player,
        uint _winnings
    ) external onlyCommissioner(_seasonId) {
        Season storage season = seasons[_seasonId];
        Player storage player = season.players[_player];
         if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        if (player.id == address(0)) {
            revert PlayerNotInLeague();
        }

        player.winnings += _winnings;
        season.prizePool -= _winnings;

        emit PlayerWin(_seasonId, _player, _winnings);
    }

    function withdrawWinnings(uint _seasonId) external {
        Season storage season = seasons[_seasonId];
        Player storage player = season.players[msg.sender];
         if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        if (player.id != msg.sender) {
            revert CannotWithdrawOtherUsersFunds();
        }
        uint winnings = player.winnings;
        if (winnings <= 0 ) {
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

    function tipCommisioner(uint _seasonId, uint _amount) external payable onlyWhitelisted(_seasonId, msg.sender){
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        (bool success, ) = seasons[_seasonId].commissioner.call{value: _amount}("");
        if (!success) {
            revert FailedToSendTip();
        }

        emit TippedCommissioner(_seasonId, msg.sender);
    }

    function completeSeason(
        uint _seasonId
    ) external onlyCommissioner(_seasonId) {
        Season storage season = seasons[_seasonId];

        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
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

    function getSeasonPrizePool(uint _seasonId) external view returns (uint) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].prizePool;
    }

    function getBuyInAmount(uint _seasonId) external view returns (uint) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].buyIn;
    }

    function getSeasonCommissioner(
        uint _seasonId
    ) external view returns (address) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].commissioner;
    }

    function getWhiteListedMember(uint _seasonId, address _member) external view returns (bool) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].whitelist[_member];
    }

    function getPlayer(uint _seasonId, address _member) external view returns (bool) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        if( seasons[_seasonId].players[_member].id == _member) {
            return true;
        }
        return false;
    }

    function getSeasonWinnings(uint _seasonId) external view returns (uint) {
        if(_seasonId < 0 || _seasonId >= seasonCounter ) {
            revert SeasonDoesNotExist();
        }
        return seasons[_seasonId].players[msg.sender].winnings;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    receive() external payable {}

    fallback() external payable {}
}
