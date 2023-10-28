// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "./@solvprotocol/erc-3525/ERC3525.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Business is ERC3525, Ownable {
    constructor(
        bool isWhitelisted_,
        bool isLock_,
        bool isCap_
    ) ERC3525("MyERC3525", "MY3525", 18) {
        rights.isWhitelisted = isWhitelisted_;
        rights.isLock = isLock_;
        rights.isCap = isCap_;
    }

    struct Rights {
        bool isWhitelisted;
        bool isLock;
        bool isCap;
    }

    struct ProjectInfo {
        uint hasInvestedAmount;
        uint hasTotalAmount;
        uint waittingReciviedCap;
    }

    struct InvestInfo {
        address investor;
        uint investAmount;
        uint proportion;
    }

    struct WithdrewHistory {
        uint amount;
        address handler;
        address receiver;
        uint time;
    }

    Rights public rights;
    ProjectInfo public projectInfo;
    WithdrewHistory[] public withdrewHistory;

    address[] public allInvestors;
    mapping(address => uint) public investorsAmount;
    mapping(address => uint) public whiteCanInverstAmout;

    function setWhiteCanInverstAmouts(
        address[] memory investors_,
        uint[] memory amounts_
    ) external onlyOwner {
        require(investors_.length == amounts_.length, "Err_Length_Not_Equal");
        for (uint i = 0; i < investors_.length; i++) {
            whiteCanInverstAmout[investors_[i]] = amounts_[i];
        }
    }

    function setProjectInvestCap(uint amount) external onlyOwner {
        projectInfo.waittingReciviedCap = amount;
    }

    function mint() external payable {
        uint value = msg.value;

        require(value != 0, "Err_Invalid_Invest_Amount");
        require(rights.isLock == false, "Err_Project_Locked");

        _mint(msg.sender, 1, value);

        if (rights.isWhitelisted) whiteCanInverstAmout[msg.sender] -= value;
        if (rights.isCap)
            require(
                (value + projectInfo.hasInvestedAmount) <=
                    projectInfo.waittingReciviedCap,
                "Err_Project_Overflow_Cap"
            );
        if (_arrInAddresses(allInvestors, msg.sender) == false) {
            allInvestors.push(msg.sender);
        }

        projectInfo.hasInvestedAmount += msg.value;
    }

    function queryInvestorInfo(
        address investor_
    ) public view returns (InvestInfo memory investInfo) {
        investInfo.investor = investor_;
        investInfo.investAmount = investorsAmount[investor_];
        investInfo.proportion = uint(
            (investorsAmount[investor_] * 10e18) / projectInfo.hasInvestedAmount
        );
    }

    function queryAllInvestorInfo()
        external
        view
        returns (InvestInfo[] memory)
    {
        uint len = allInvestors.length;
        InvestInfo[] memory allInvestInfo = new InvestInfo[](len);
        for (uint i; i < len; i++) {
            allInvestInfo[i] = queryInvestorInfo(allInvestors[i]);
        }

        return allInvestInfo;
    }

    function _arrInAddresses(
        address[] memory addresses,
        address check
    ) internal pure returns (bool) {
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == check) return true;
        }
        return false;
    }

    function setRightsIsLock(bool isLock_) external onlyOwner {
        rights.isLock = isLock_;
    }

    function bonus(uint bonusAmount) external payable onlyOwner {
        for (uint i = 0; i < allInvestors.length; i++) {
            InvestInfo memory one = queryInvestorInfo(allInvestors[i]);
            _withdraw(allInvestors[i], (bonusAmount * one.proportion) / 10e18);
        }
    }

    function withdraw(
        address receiver,
        uint amount
    ) external payable onlyOwner {
        _withdraw(receiver, amount);
    }

    function _withdraw(address receiver, uint amount) internal {
        payable(receiver).call{value: amount}("");

        withdrewHistory.push(
            WithdrewHistory({
                amount: amount,
                handler: msg.sender,
                receiver: receiver,
                time: block.timestamp
            })
        );

        projectInfo.hasTotalAmount -= amount;
    }

    function _afterValueTransfer(
        address from_,
        address to_,
        uint256 fromTokenId_,
        uint256 toTokenId_,
        uint256 slot_,
        uint256 value_
    ) internal virtual override {
        if (investorsAmount[from_] != 0) investorsAmount[from_] -= value_;
        investorsAmount[to_] += value_;
    }

    receive() external payable {
        projectInfo.hasTotalAmount += msg.value;
    }
}
