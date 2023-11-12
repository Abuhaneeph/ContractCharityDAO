# CHARITY FUNDING DAO

Welcome to the Charity Funding DAO project, an initiative designed to streamline funding for charities with minimal intermediaries. This DAO empowers its members to select and support charities directly through a transparent and community-driven process.

## Core Concepts

### FundRaiser (Charity DAO)

#### Overview

The `FundRaiser` contract manages the DAO's funds and charity-related functionalities.

#### Core Functions

1. **Sending Money to a Charity**

    - Function: `sendToCharity(address _address, uint256 _amount)`
    - Description: Transfers funds to an approved charity.

2. **Allowing New Charities**

    - Function: `allowNewCharity(string memory _charityName, address _address)`
    - Description: Permits new charities to participate in the fund.

3. **Checking Charity Fund Balance**

    - Function: `charityFundBalance()`
    - Description: Retrieves the current balance of the charity fund.

4. **Retrieving Charity Information**
    - Functions:
        - `checkCharityName(address _address)`: Retrieves the name of an approved charity.
        - `checkAllowedCharityFunding(address _address)`: Checks the total funding allocated to a charity.

### FundToken (Governance Token)

#### Overview

The `FundToken` contract represents the DAO's governance token and is linked to the `FundRaiser` contract.

#### Core Functions

1. **Minting Tokens and Funding Charities**

    - Function: `sendFunds()`
    - Description: Mints tokens and sends funds to the charity fund.

2. **Retrieving FundRaiser Address**
    - Function: `getFundRaiserAddress()`
    - Description: Returns the address of the associated `FundRaiser` contract.

## How to Deploy

1. Deploy the project by running:
    ```bash
    yarn hardhat deploy
    ```

## Testing DAO Functionality

1. Start the Hardhat blockchain:
    ```bash
    yarn hardhat node
    ```
2. Propose adding a charity:
    ```bash
    yarn hardhat run scripts/newpropose.js
    ```
3. Vote on the proposal:
    ```bash
    yarn hardhat run scripts/vote.js
    ```
4. Queue and execute the proposal:
    ```bash
    yarn hardhat run scripts/queue-and-execute.js
    ```

## Contribution

We welcome contributions from the community. If you'd like to contribute, please follow these guidelines:

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes: `git commit -am 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Submit a pull request.

Please make sure to update tests as appropriate and adhere to the code of conduct.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
