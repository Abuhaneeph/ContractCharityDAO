const { ethers, getNamedAccounts, getChainId } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("../utils/move-blocks")
const fs = require("fs")

async function vote() {
    const { deployer } = await getNamedAccounts()
    //GET PROPOSAL ID
    console.log("Getting the proposal ID...")
    let proposals
    proposals = JSON.parse(fs.readFileSync("proposals.json", "utf8"))
    const proposalId = proposals[network.config.chainId].toString()
    console.log(`This is the proposal Id ${proposalId}`)

    //VOTE INPUT
    console.log("Preparing the vote input...")
    const decision = 1 //FOR
    const description = "I support this charity"
    const chainId = network.config.chainId

    //CAST THE VOTE
    const governor = await ethers.getContract("CharityDAO", deployer)
    console.log("The vote input is ready!!!")
    console.log("Casting the vote...")
    const castVote = await governor.castVoteWithReason(proposalId, decision, description)
    // const castVote = await governor.castVote(proposalId, decision)
    await castVote.wait(1)
    console.log("The address has voted successfully!!!")
    console.log(`ForVotes: ${(await governor.proposalVotes(proposalId)).forVotes.toString()}`)
    if (developmentChains.includes(network.name)) {
        await moveBlocks(networkConfig[chainId]["votingPeriod"] + 1)
    }
    console.log(`Current proposal state ${await governor.state(proposalId)}`)
    console.log("----------------------------------------------")
}

vote()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
