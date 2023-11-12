// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "../contracts/FundRaiser.sol";

/**
 * @title FundToken
 * @dev The FundToken contract represents the governance token for the Charity Funding DAO.
 * It extends ERC20Votes and is associated with the FundRaiser contract for managing charitable funds.
 */
contract FundToken is ERC20Votes {
    // Reference to the FundRaiser contract
    FundRaiser public fundraiser;

    /**
     * @dev Constructor for FundToken.
     * @param _fundraiser The address of the FundRaiser contract.
     */
    constructor(
        address _fundraiser
    ) ERC20("GovernanceToken", "GOV") ERC20Permit("GovernanceToken") {
        fundraiser = FundRaiser(payable(_fundraiser));
    }

    /**
     * @dev Hook called after a token transfer.
     * @param from The sender's address.
     * @param to The recipient's address.
     * @param amount The amount of tokens transferred.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    /**
     * @dev Internal function to mint new tokens.
     * @param to The recipient's address.
     * @param amount The amount of tokens to mint.
     */
    function _mint(address to, uint256 amount) internal override(ERC20Votes) {
        super._mint(to, amount);
    }

    /**
     * @dev Internal function to burn tokens.
     * @param account The address whose tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function _burn(address account, uint256 amount) internal override(ERC20Votes) {
        super._burn(account, amount);
    }

    /**
     * @dev Sends funds to the Charity Fund and mints tokens to the sender.
     */
    function sendFunds() public payable {
        // Contribute funds to the Charity Fund
        fundraiser.addToCharityFund{value: msg.value}();

        // Mint tokens to the sender equivalent to the sent funds
        _mint(msg.sender, msg.value); //Reentrancy proof
    }

    /**
     * @dev Gets the address of the associated FundRaiser contract.
     * @return The address of the FundRaiser contract.
     */
    function getFundRaiserAddress() public view returns (FundRaiser) {
        return fundraiser;
    }

    /**
     * @dev Fallback function called if a function doesn't exist in the contract, contains msg.data.
     */
    fallback() external payable {
        sendFunds();
    }

    /**
     * @dev Receive function called if a function doesn't exist in the contract, doesn't contain msg.data.
     */
    receive() external payable {
        sendFunds();
    }
}
