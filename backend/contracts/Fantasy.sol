// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Fantasy {
    address public commissioner;
    uint256 public entryFee;
    uint256 public prizePool;
    uint256 tip;
    mapping(address => uint256) public winnings;
    mapping(address => bool) public isWhitelisted;

    event JoinedLeague(address indexed member, uint256 entryFeePaid);
    event AddWinnings(address indexed member, uint256 prize);
    event WithdrewWinnings(address indexed member, uint256 amount);
    event CommissionerWithdrew(address indexed commissioner, uint256 amount);
    event TippedCommissioner(address indexed tipper, uint256 amount);

    constructor(uint256 _entryFee) {
        commissioner = msg.sender;
        entryFee = _entryFee;
        isWhitelisted[commissioner] = true;
    }

    modifier onlyCommissioner() {
        require(
            msg.sender == commissioner,
            "Only the commissioner can call this function."
        );
        _;
    }

    modifier onlyWhitelisted() {
        require(
            isWhitelisted[msg.sender],
            "You are not whitelisted to join the league."
        );
        _;
    }

    function whitelistAddress(
        address _memberAddress
    ) external onlyCommissioner {
        isWhitelisted[_memberAddress] = true;
    }

    function joinLeague() external payable onlyWhitelisted {
        require(
            msg.value >= entryFee,
            "Insufficient payment to join the league."
        );

        prizePool += msg.value;

        emit JoinedLeague(msg.sender, msg.value);
    }

    function addWinnings(
        address _winner,
        uint256 _amount
    ) external onlyCommissioner {
        require(prizePool >= _amount, "Not enough funds in the prize pool");

        prizePool -= _amount;
        winnings[_winner] += _amount;

        emit AddWinnings(_winner, _amount);
    }

    function withdrawWinnings() external {
        uint256 amount = winnings[msg.sender];
        require(amount > 0, "You have no winnings to withdraw.");

        // Set winnings to zero before transfer to prevent re-entrancy attack
        winnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit WithdrewWinnings(msg.sender, amount);
    }

    function tipCommish() external payable {
        require(msg.value > 0, "Tip needs to be greater than 0");

        emit TippedCommissioner(msg.sender, msg.value);
    }

    function withdrawTip() external onlyCommissioner {
        require(tip > 0, "No tips to withdraw");

        uint256 tipAmount = tip;
        tip = 0;
        payable(commissioner).transfer(tipAmount);

        emit CommissionerWithdrew(commissioner, tipAmount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

// deployed to 0x2F6B385330C888D326e1f4F39764D0B68EE792Ce

// https://sepolia.etherscan.io/address/0x2F6B385330C888D326e1f4F39764D0B68EE792Ce#code
