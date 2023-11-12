const { ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const { log, deploy } = deployments

    const getConfirmations = developmentChains.includes(network.name) ? 1 : 5

    args = []

    log("Deploying the contract...")
    const fundRaiser = await deploy("FundRaiser", {
        log: true,
        from: deployer,
        args: args,
        waitConfirmations: getConfirmations,
    })

    log("Contract fundRaiser has been deployed!!!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundRaiser.address, args)
    }
    // log("Updating the contract data...")
    // const fundRaiserInteract = await ethers.getContract("FundRaiser", deployer)
    // const contractData = {
    //     fundRaiser: {
    //         address: fundRaiser.address,
    //         abi: JSON.parse(fundRaiser.interface.format(ethers.utils.FormatTypes.json)),
    //     },
    // }
    // fs.writeFileSync("./FundRaiserAddressaAbi.json", JSON.stringify(contractData))
    // log("The contract data has been successfully updated!!!")
    log("----------------------------------------------")
}
module.exports.tags = ["all", "FundRaiser"]
