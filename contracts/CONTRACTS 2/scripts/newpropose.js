const { ethers, getNamedAccounts, getChainId } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("../utils/move-blocks")
const fs = require("fs")

async function newproposal(calledFunction, charityName, address, proposalDescription) {
    let chainId
    let fundToken
    //GET THE TOKENS
    const { deployer } = await getNamedAccounts()
    fundToken = await ethers.getContract("FundToken")
    console.log("Sending the funds to the contract...")
    const getTokens = await fundToken.sendFunds({ value: ethers.parseEther("1") })
    await getTokens.wait(1)
    console.log("Sending funds was successful!!!")
    console.log("Delegating the tokens...")
    const delegate = await fundToken.delegate(deployer)
    await delegate.wait(1)
    console.log("Delegating was successful!!!")

    //CONNECTING TO CONTRACTS
    console.log("Connecting to the contracts...")
    const fundRaiser = await ethers.getContract("FundRaiser")
    const governor = await ethers.getContract("CharityDAO")
    chainId = network.config.chainId
    console.log("Connected to the contract successfully!!!")

    //PROPOSAL
    const encodedFunction = fundRaiser.interface.encodeFunctionData(calledFunction, [
        charityName,
        address,
    ])
    console.log("Proposing...")
    const propose = await governor.propose(
        [fundRaiser.target],
        [0],
        [encodedFunction],
        proposalDescription,
    )
    console.log("Proposal sucessful!!!")
    if (developmentChains.includes(network.name)) {
        await moveBlocks(networkConfig[chainId]["votingDelay"] + 1)
    }
    const proposeReceipt = await propose.wait(1)
    const proposalId = proposeReceipt.logs[0].args.proposalId
    console.log(`Proposed with proposal ID: ${proposalId}`)

    console.log(`Current proposal state ${await governor.state(proposalId)}`)

    //SETTING ASIDE THE PROPOSAL ID
    let proposals, newChainId
    newChainId = network.config.chainId.toString()
    if (fs.existsSync("proposals.json")) {
        proposals = JSON.parse(fs.readFileSync("proposals.json", "utf8"))
        if (developmentChains.includes(network.name)) {
            proposals[newChainId] = []
        }
    } else {
        proposals = {}
        proposals[newChainId] = []
    }
    proposals[newChainId].push(proposalId.toString())
    fs.writeFileSync("proposals.json", JSON.stringify(proposals), "utf8")
    console.log("----------------------------------------------")
}

newproposal(
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
