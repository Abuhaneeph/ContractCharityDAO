// SPDX-License-Identifier:MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FundRaiser
 * @dev The FundRaiser contract manages a decentralized autonomous organization (DAO) for charitable funding.
 * It allows the DAO owner to send funds to approved charities and control the inclusion of new charities.
 */
contract FundRaiser is Ownable {
    // Custom errors for better clarity
    error charityNameToLong();
    error addressNotAllowed();
    error balanceInsufficient();

    // Events
    event fundsSentToCharity(address indexed _address, uint256 _amount);
    event charityFunded(address indexed _address, uint256 _amount);
    event newCharityAllowed(address indexed _address, bytes32 _name, bytes32 _category); // Updated event

    // Struct to represent an allowed charity
    struct allowedCharity {
        uint256 charityBalance;
        bytes32 charityName;
        bytes32 category; // New field for the category
        bool exists;
    }

    // Mapping to store allowed charities
    mapping(address => allowedCharity) public allowedCharities;
    address[] public addressArray; // New array to track signed-up charities

    /**
     * @dev Sends funds to an approved charity.
     * @param _address The address of the charity.
     * @param _amount The amount of funds to send.
     * @notice Only accessible by the DAO.
     */
    function sendToCharity(address _address, uint256 _amount) public onlyOwner {
        // Check if the charity exists in the DAO
        if (!allowedCharities[_address].exists) {
            revert addressNotAllowed();
        }
        // Check if the charity fund has sufficient balance
        if (charityFundBalance() < _amount) {
            revert balanceInsufficient();
        }

        // Update charity balance and transfer funds
        allowedCharities[_address].charityBalance += _amount;
        payable(_address).transfer(_amount);

        // Emits the event
        emit fundsSentToCharity(_address, _amount);
    }

    /**
     * @dev Allows a new charity to participate in the DAO.
     * @param _charityName The name of the new charity.
     * @param _address The address of the new charity.
     * @param _category The category of the new charity. Added parameter.
     * @notice Only accessible by the DAO.
     */
    function allowNewCharity(string memory _charityName, address _address, string memory _category) public onlyOwner {
        // Check if the charity name exceeds the allowed length
        if (bytes(_charityName).length > 24) {
            revert charityNameToLong();
        }

        // Mark the charity as allowed and set its name and category
        allowedCharities[_address].exists = true;
        allowedCharities[_address].charityName = bytes32(bytes(_charityName));
        allowedCharities[_address].category = bytes32(bytes(_category));

        // Add the charity address to the array
        addressArray.push(_address);

        // Emits the event with the category
        emit newCharityAllowed(_address, bytes32(bytes(_charityName)), bytes32(bytes(_category)));
    }

    /**
     * @dev Adds received funds to the overall charity fund.
     * @notice If this is called you don't get governance token, you only donate.
     * @notice Call function sendFunds from FundToken to fund the contract and receive Governance Tokens
     */
    function addToCharityFund() public payable {
        // Emits an event
        emit charityFunded(msg.sender, msg.value);
    }

    /**
     * @dev Returns the current balance of the charity fund.
     * @return The current balance of the charity fund.
     */
    function charityFundBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Returns the name of an allowed charity.
     * @param _address The address of the charity.
     * @return The name of the charity.
     * @notice names stored in bytes to decrease gas cost
     */
    function checkCharityName(address _address) public view returns (bytes32) {
        // Check if the charity exists in the DAO
        if (!allowedCharities[_address].exists) {
            revert addressNotAllowed();
        }
        return allowedCharities[_address].charityName;
    }

    /**
     * @dev Returns the total funding allocated to an allowed charity.
     * @param _address The address of the charity.
     * @return The total funding allocated to the charity.
     */
    function checkAllowedCharityFunding(address _address) public view returns (uint256) {
        // Check if the charity exists in the DAO
        if (!allowedCharities[_address].exists) {
            revert addressNotAllowed();
        }
        return allowedCharities[_address].charityBalance;
    }

    /**
     * @dev Returns the list of signed-up charities with their category.
     * @return Arrays of addresses, names, and categories.
     */
    function getCharitiesWithCategory() public view returns (address[] memory, bytes32[] memory, bytes32[] memory) {
        uint256 charityCount = 0;
        // Count the number of signed up charities
        for (uint256 i = 0; i < addressArray.length; i++) {
            if (allowedCharities[addressArray[i]].exists) {
                charityCount++;
            }
        }

        // Initialize arrays to store charity data
        address[] memory addresses = new address[](charityCount);
        bytes32[] memory names = new bytes32[](charityCount);
        bytes32[] memory categories = new bytes32[](charityCount);

        // Populate arrays with charity data
        uint256 index = 0;
        for (uint256 i = 0; i < addressArray.length; i++) {
            if (allowedCharities[addressArray[i]].exists) {
                addresses[index] = addressArray[i];
                names[index] = allowedCharities[addressArray[i]].charityName;
                categories[index] = allowedCharities[addressArray[i]].category;
                index++;
            }
        }

        return (addresses, names, categories);
    }

    /**
     * @dev Fallback function called if a function doesn't exist in the contract, contains msg.data.
     */
    fallback() external payable {
        addToCharityFund();
    }

    /**
     * @dev Receive function called if a function doesn't exist in the contract, doesn't contain msg.data.
     */
    receive() external payable {
        addToCharityFund();
    }
}
