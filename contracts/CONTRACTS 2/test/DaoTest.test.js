const { expect, assert } = require("chai")
const { deployments, ethers, network, getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { moveBlocks } = require("../utils/move-blocks")
const { moveTime } = require("../utils/move-time")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("test", function () {
          let governor, fundRaiser, fundToken, oneether, player, player2, deployer
          oneether = ethers.parseEther("1")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              player = accounts[1]
              player2 = accounts[2]
              await deployments.fixture(["all"])
              fundRaiser = await ethers.getContract("FundRaiser", deployer)
              fundToken = await ethers.getContract("FundToken", deployer)
              governor = await ethers.getContract("CharityDAO", deployer)
          })
          describe("The basic fundRaiser and fundToken functions", function () {
              it("Send the funds and updates the balance of the fund", async function () {
                  //expect(await fundRaiser.checkcharityFundBalance().to.equal(oneether))
                  await fundToken.sendFunds({ value: oneether })
                  const balance = await fundToken.balanceOf(deployer)
                  const fundValue = await fundRaiser.charityFundBalance()
                  assert.equal(balance.toString(), oneether.toString())
                  const fundRaiserAddress = await fundToken.getFundRaiserAddress()
                  assert.equal(fundRaiserAddress, fundRaiser.target)
                  assert.equal(fundValue.toString(), oneether.toString())
              })
              it("The event emits", async () => {
                  const addToFund = await fundRaiser.addToCharityFund({ value: oneether })
                  const addToFundTx = await addToFund.wait(1)
                  assert.equal(addToFundTx.logs[0].args._amount.toString(), oneether.toString())
              })
              it("Adds to a charity fund", async function () {
                  await fundRaiser.addToCharityFund({ value: oneether })
                  const charityFund = await fundRaiser.charityFundBalance()
                  assert.equal(charityFund, oneether)
              })
              it("Reverts the function", async () => {
                  await expect(fundRaiser.checkCharityName(deployer)).to.be.reverted
                  await expect(
                      fundRaiser.checkAllowedCharityFunding(deployer)
                  ).to.be.reverted
              })
              it("Should execute the fallback function", async () => {
                await player.sendTransaction({
                    to: fundRaiser.target,
                    value: oneether,
                    data: "0x"
                })
                await player.sendTransaction({
                    to: fundRaiser.target,
                    value: oneether
                })
                const charityFund = await fundRaiser.charityFundBalance()
                assert.equal(charityFund.toString(), oneether.toString() * 2)
                await player.sendTransaction({
                    to: fundToken.target,
                    value: oneether,
                    data: "0x"
                })
                await player.sendTransaction({
                    to: fundToken.target,
                    value: oneether
                })
                const tokenFallbackAndReceive = await fundRaiser.charityFundBalance()
                assert.equal(tokenFallbackAndReceive.toString(), oneether.toString() * 4)
              })
              it("Doesn't let the functions be executed by deployer", async () => {
                await expect(fundRaiser.sendToCharity(deployer, oneether)).to.be.reverted
                await expect(fundRaiser.allowNewCharity("This is a charity", deployer)).to.be.reverted
              })
          })
          describe("The whole DAO process", function () {
            it("Completes the DAO fundRaiser functions", async () => {
                // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed - state
                // 0:Againts 1:For 2:Abstain - voting
                let proposalId, governorState

                //FUNCTION 1 - allows new charity to be funded
                await fundToken.sendFunds({ value: oneether})
                await fundToken.delegate(deployer)
                const charityName = "AED"
                const charityAddress = player.address
                const chainId = network.config.chainId
                const proposalDescription = "This charity will help people with heart problems"
                const encodedFunction = fundRaiser.interface.encodeFunctionData("allowNewCharity", [
                    charityName,
                    charityAddress,
                ])
                const propose = await governor.propose([fundRaiser.target], [0], [encodedFunction], proposalDescription)
                const proposeTx = await propose.wait(1)
                await moveBlocks(networkConfig[chainId]["votingDelay"] + 1)
                proposalId = proposeTx.logs[0].args.proposalId
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "1")
                await governor.castVoteWithReason(proposalId, 1, "I'm for it")
                await moveBlocks(networkConfig[chainId]["votingPeriod"] + 1)
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "4")
                const hashedDescription = await ethers.keccak256(ethers.toUtf8Bytes(proposalDescription))
                await governor.queue([fundRaiser.target], [0], [encodedFunction], hashedDescription)
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "5")
                await moveTime(networkConfig[chainId]["minDelay"] + 1)
                await governor.execute([fundRaiser.target], [0], [encodedFunction], hashedDescription)
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "7")
                const isAllowed = await fundRaiser.checkCharityName(charityAddress)
                assert.equal(ethers.decodeBytes32String(isAllowed), charityName)

                //FUNCTION 2 - sends funds to the charity
                const amount = oneether
                const proposalDescription2 = "We want to fund AED"
                const encodedFunction2 = fundRaiser.interface.encodeFunctionData("sendToCharity", [
                    charityAddress,
                    amount,
                ])
                const propose2 = await governor.propose([fundRaiser.target], [0], [encodedFunction2], proposalDescription2)
                const proposeTx2 = await propose2.wait(1)
                await moveBlocks(networkConfig[chainId]["votingDelay"] + 1)
                proposalId = proposeTx2.logs[0].args.proposalId
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "1")
                await governor.castVoteWithReason(proposalId, 1, "I'm for it")
                await moveBlocks(networkConfig[chainId]["votingPeriod"] + 1)
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "4")
                const hashedDescription2 = await ethers.keccak256(ethers.toUtf8Bytes(proposalDescription2))
                await governor.queue([fundRaiser.target], [0], [encodedFunction2], hashedDescription2)
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "5")
                await moveTime(networkConfig[chainId]["minDelay"] + 1)
                await governor.execute([fundRaiser.target], [0], [encodedFunction2], hashedDescription2)
                governorState = await governor.state(proposalId)
                assert.equal(governorState.toString(), "7")
                const charityBalance = await fundRaiser.checkAllowedCharityFunding(charityAddress)
                assert.equal(charityBalance.toString(), amount.toString())
            })
          })
      })
