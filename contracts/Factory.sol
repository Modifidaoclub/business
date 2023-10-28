// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {Business} from "./Main.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Factory is Ownable {
    mapping(address => bool) public isBusiness;

    function newBusiness(
        bool isWhitelisted_,
        bool isLock_,
        bool isCap_
    ) external returns (address) {
        Business newInstance = new Business(isWhitelisted_, isLock_, isCap_);

        address addr = address(newInstance);
        isBusiness[addr] = true;
        return addr;
    }
}
