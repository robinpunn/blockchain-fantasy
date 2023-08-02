// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Fantasy {
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
        bool started;
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
    event SeasonCompleted(uint indexed seasonId, address indexed commisioner);

    modifier onlyWhitelisted(uint _seasonId, address _address) {
        require(
            seasons[_seasonId].whitelist[_address],
            "Address not whitelisted"
        );
        _;
    }
    modifier onlyCommissioner(uint _seasonId) {
        require(
            msg.sender == seasons[_seasonId].commissioner,
            "Only commissioner can perform this action"
        );
        _;
    }

    function addSeason(uint _buyIn) external {
        uint newSeasonId = seasonCounter;
        Season storage newSeason = seasons.push();
        newSeason.id = newSeasonId;
        newSeason.buyIn = _buyIn;
        newSeason.commissioner = payable(msg.sender);
        newSeason.started = true;
        newSeason.whitelist[msg.sender] = true;
        seasonCounter++;
        emit SeasonStarted(newSeasonId, msg.sender);
        emit Whitelisted(newSeasonId, msg.sender);
    }

    function addToWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner(_seasonId) {
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
        require(season.started, "Season has not started yet");
        require(_buyIn == season.buyIn, "Incorrect buy-in amount");
        require(
            msg.value == _buyIn,
            "Ether sent did not match the buy-in amount"
        );
        Player storage player = season.players[msg.sender];
        require(
            player.id == address(0),
            "Player has already joined the season"
        );

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
        require(season.started, "Season has not started yet");
        Player storage player = season.players[_player];
        require(player.id != address(0), "Player is not part of the season");
        player.winnings += _winnings;
        season.prizePool -= _winnings;

        emit PlayerWin(_seasonId, _player, _winnings);
    }

    function withdrawWinnings(uint _seasonId) external {
        Season storage season = seasons[_seasonId];
        require(season.started, "Season has not started yet");

        Player storage player = season.players[msg.sender];
        require(
            player.id == msg.sender,
            "You can't withdraw someone else's funds"
        );

        uint winnings = player.winnings;
        require(winnings > 0, "No winnings to withdraw");

        (bool success, ) = msg.sender.call{value: winnings}("");
        if (success) {
            player.winnings = 0;
        }
        require(success, "Failed to send winnings");

        emit PlayerWin(_seasonId, msg.sender, winnings);
    }

    function completeSeason(
        uint _seasonId
    ) external onlyCommissioner(_seasonId) {
        Season storage season = seasons[_seasonId];
        require(!season.complete, "Season is already complete");
        require(season.prizePool == 0, "Players still need to be paid");

        season.complete = true;

        emit SeasonCompleted(_seasonId, msg.sender);
    }

    function getSeasonPrizePool(uint _seasonId) external view returns (uint) {
        return seasons[_seasonId].prizePool;
    }

    function getSeasonCommissioner(
        uint _seasonId
    ) external view returns (address) {
        return seasons[_seasonId].commissioner;
    }

    function getSeasonWinnings(uint _seasonId) external view returns (uint) {
        return seasons[_seasonId].players[msg.sender].winnings;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    receive() external payable {}

    fallback() external payable {}
}
