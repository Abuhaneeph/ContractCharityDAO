const { ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const { log, deploy } = deployments

    const getConfirmations = developmentChains.includes(network.name) ? 1 : 5
    const FundRaiser = await ethers.getContract("FundRaiser")
    const FundRaiserAddress = FundRaiser.target
    log(`The fundRaiser address is ${FundRaiserAddress}`)

    const args = [FundRaiserAddress]
    // const args = [0x000000000]
    log("Deploying the contract...")
    const fundToken = await deploy("FundToken", {
        log: true,
        from: deployer,
        args: args,
        waitConfirmations: getConfirmations,
    })
    log("Contract fundToken has been deployed!!!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundToken.address, args)
    }
    log("----------------------------------------------")
}
module.exports.tags = ["all", "FundToken", "GovernanceToken"]
