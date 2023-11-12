const { ethers } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
        minDelay: 3600,
        votingPeriod: 5,
        votingDelay: 1,
        quorum: 4,
        addressZero: "0x0000000000000000000000000000000000000000",
    },
    80001: {
        name: "mumbai",
        minDelay: 3600,
        votingPeriod: "50400",
        votingDelay: "7200",
        quorum: "60",
        addressZero: "0x0000000000000000000000000000000000000000",
    },
    11155111: {
        name: "sepolia",
        minDelay: 3600,
        votingPeriod: "50400",
        votingDelay: "7200",
        quorum: "60",
        addressZero: "0x0000000000000000000000000000000000000000",
    },
    31337: {
        name: "localhost",
        minDelay: 3600,
        votingPeriod: 5,
        votingDelay: 1,
        quorum: 4,
        addressZero: "0x0000000000000000000000000000000000000000",
    },
    mocha: {
        timeout: 200000,
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
