// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FantasyFootballContract {
    struct Player {
        address id;
        bool buyIn;
        uint winnings;
    }

    struct Season {
        uint id;
        address commissioner;
        mapping(address => bool) whitelist;
        mapping(address => Player) players;
        uint buyIn;
        uint prizePool;
        bool started;
        bool distributed;
        bool complete;
    }

    uint private seasonCounter;
    Season[] seasons;

    event SeasonStarted(uint seasonId, address commissioner);
    event MemberJoined(uint seasonId, address member);
    event PlayerWin(uint seasonId, address member, uint addedWinning);
    event SeasonCompleted(uint seasonId, address commisioner);

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
        Season storage newSeason = seasons[newSeasonId];
        newSeason.id = newSeasonId;
        newSeason.buyIn = _buyIn * 1 ether;
        newSeason.commissioner = msg.sender;
        newSeason.started = true;
        seasonCounter++;

        emit SeasonStarted(newSeasonId, msg.sender);
    }

    function addToWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner(_seasonId) {
        seasons[_seasonId].whitelist[_address] = true;
    }

    function removeFromWhitelist(
        uint _seasonId,
        address _address
    ) external onlyCommissioner(_seasonId) {
        delete seasons[_seasonId].whitelist[_address];
    }

    function buyIn(
        uint _seasonId
    ) external payable onlyWhitelisted(_seasonId, msg.sender) {
        Season storage season = seasons[_seasonId];
        require(season.started, "Season has not started yet");

        require(msg.value == season.buyIn, "Incorrect buy-in amount");

        Player storage player = season.players[msg.sender];
        require(
            player.id == address(0),
            "Player has already joined the season"
        );

        player.id = msg.sender;
        player.buyIn = true;
        season.prizePool += msg.value;

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

        player.winnings = 0;

        (bool success, ) = msg.sender.call{value: winnings}("");
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
}
