const { network } = require("hardhat")

const moveBlocks = async (blocks) => {
    console.log(`Moving forward in time for ${blocks} blocks`)
    for (let i = 0; i < blocks; i++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })
        console.log(`Mined block ${i}`)
    }
    console.log("Moved forward in time succesfully!!!")
}

module.exports = {
    moveBlocks,
}
