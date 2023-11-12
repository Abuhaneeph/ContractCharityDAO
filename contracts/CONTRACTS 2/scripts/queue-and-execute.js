const { ethers, getNamedAccounts, getChainId } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("../utils/move-blocks")
const fs = require("fs")
const { moveTime } = require("../utils/move-time")

async function queueAndExecute(calledFunction, charityName, address, proposalDescription) {
    console.log("Preparing the input and connecting to the contracts...")
    let proposals
    proposals = JSON.parse(fs.readFileSync("proposals.json", "utf8"))
    const proposalId = proposals[network.config.chainId].toString()
    const chainId = network.config.chainId
    const governor = await ethers.getContract("CharityDAO")
    const fundRaiser = await ethers.getContract("FundRaiser")
    const encodedFunction = fundRaiser.interface.encodeFunctionData(calledFunction, [
        charityName,
        address,
    ])
    const votingPeriod = governor.votingPeriod()
    const votingPeriodNumber = votingPeriod.toString()
    console.log(`This is the voting period ${votingPeriodNumber}`)
    const hashedDescription = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription))
    console.log("Input prepared!!!")
    console.log("Calling the queue function...")
    const queue = await governor.queue(
        [fundRaiser.target],
        [0],
        [encodedFunction],
        hashedDescription,
    )
    await queue.wait(1)
    console.log("Queue called successfully!!!")
    console.log(`Current proposal state ${await governor.state(proposalId)}`)

    if (developmentChains.includes(network.name)) {
        await moveTime(networkConfig[chainId]["minDelay"])
    }
    console.log(`Governor contract ${governor.target}`)
    console.log(`FundRaise contract ${fundRaiser.target}`)
    console.log(`FundToken contract ${(await ethers.getContract("FundToken")).target}`)
    console.log(`TimeLock contract ${(await ethers.getContract("TimeLock")).target}`)

    console.log("Calling the execute function...")
    const execute = await governor.execute(
        [fundRaiser.target],
        [0],
        [encodedFunction],
        hashedDescription,
    )
    await execute.wait(1)
    console.log(`Current proposal state ${await governor.state(proposalId)}`)
    console.log("Execute function called successfully!!!")
    console.log("----------------------------------------------")
    console.log("Calling the charity function to check if it was executed...")
    const getCharity = await fundRaiser.checkCharityName(address)
    console.log(getCharity.toString())
}

queueAndExecute(
    "allowNewCharity",
    "AED",
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    "Intending on helping people with heart problems",
)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
