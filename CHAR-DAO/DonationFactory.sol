// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./Donation.sol";

contract DonationFactory{
  DonationContract [] public donations;
   
   
   function createDonationFactory() public {
        DonationContract newDonation = new DonationContract ();
        donations.push(newDonation);
    }


}