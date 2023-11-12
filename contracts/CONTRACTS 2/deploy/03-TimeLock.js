const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    let minDelay
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    const chainId = network.config.chainId
    const getConfirmation = developmentChains.includes(network.name) ? 1 : 5
    minDelay = networkConfig[chainId]["minDelay"]
    args = [minDelay, [], [], deployer]

    log("Deploying the contract...")
    const timeLock = await deploy("TimeLock", {
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
}

module.exports.tags = ["all", "timeLock"]
