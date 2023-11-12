const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    const chainId = network.config.chainId
    const getConfirmation = developmentChains.includes(network.name) ? 1 : 5

    let votingPeriod, votingDelay, quorum, tokenAddress, timeLockAddress, addressZero

    votingPeriod = networkConfig[chainId]["votingPeriod"]
    votingDelay = networkConfig[chainId]["votingDelay"]
    quorum = networkConfig[chainId]["quorum"]
    addressZero = networkConfig[chainId]["addressZero"]

    const token = await ethers.getContract("FundToken", deployer)
    tokenAddress = token.target
    const timeLock = await ethers.getContract("TimeLock", deployer)
    timeLockAddress = timeLock.target
    const fundRaiser = await ethers.getContract("FundRaiser", deployer)

    args = [tokenAddress, timeLockAddress, votingDelay, votingPeriod, quorum]

    log("Deploying the contract...")
    const governor = await deploy("CharityDAO", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: getConfirmation,
    })

    log("Contract timeLock has been deployed!!!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(timeLock.address, args)
    }
    log("----------------------------------------------")
    log("Setting up the roles...")
    const proposerRole = await timeLock.PROPOSER_ROLE()
    const executorRole = await timeLock.EXECUTOR_ROLE()
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()

    const proposerTx = await timeLock.grantRole(proposerRole, governor.address) // This states that governor is the only one who can do anything
    await proposerTx.wait(1)
    const executorTx = await timeLock.grantRole(executorRole, addressZero) // Giving executor to nobody which means to anybody
    await executorTx.wait(1)
    const revokeTx = await timeLock.revokeRole(adminRole, deployer) // Nobody owns a timeLock controle
    await revokeTx.wait(1)
    log("The roles have been set successfully!!!")
    log("----------------------------------------------")
    log("Transfering ownership of the charity fund to a DAO...")
    const transferOwnerTx = await fundRaiser.transferOwnership(timeLockAddress)
    await transferOwnerTx.wait(1)
    log("The ownership has been transfered successfully!!!")
    log("----------------------------------------------")
}

module.exports.tags = ["all", "governor", "governorContract"]
