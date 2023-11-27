// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {CharToken} from "./Governance-Token.sol";
contract DonationContract  is OwnerIsCreator, CharToken{
    
    uint256 public totalDonations;
     receive() external payable {
        donate("");
    }

     event DonationReceived(address indexed donor, uint256 amount, string message);

    

    function donate(string memory message) public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");

        totalDonations += msg.value;
        _mint(msg.sender,msg.value);

        emit DonationReceived(msg.sender, msg.value, message);
    }

     function withdraw(address _charity_address) public payable onlyOwner {
    require(msg.value > 0, "No funds to withdraw");

    uint256 totalAmount = msg.value;
    uint256 charityAmount = (totalAmount * 95) / 100;
    uint256 daoAmount = totalAmount - charityAmount;

    (bool charitySuccess, ) = payable(_charity_address).call{value: charityAmount}("");
    require(charitySuccess, "Charity transfer failed");

    uint256 daoBalance = address(this).balance;
    require(daoBalance >= daoAmount, "Insufficient funds for DAO");

    // Handle DAO funds as needed (e.g., transfer to  charity address)
    // (bool daoSuccess, ) = payable(daoAddress).call{value: daoAmount}("");
    // require(daoSuccess, "DAO transfer failed");

    if (daoBalance > daoAmount) {
        (bool ownerSuccess, ) = payable(owner()).call{value: daoBalance - daoAmount}("");
        require(ownerSuccess, "Remaining funds transfer to owner failed");
    }
}

}
