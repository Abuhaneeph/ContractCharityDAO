// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CharToken is ERC20 {
   

    // user address => minted amount
    mapping(address => uint256) public allocations;

    constructor() ERC20("Char-Token", "CHAR") {
       
    }
    

   
}
