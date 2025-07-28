import { ethers } from 'hardhat'

async function deploySettleContract() {
    console.log('Deploying Zettle contract...')
    const SETTLE_CONTRACT_NAME = 'SplitPayment';
    const usdc = "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98";
    const settleContract = await ethers.deployContract(SETTLE_CONTRACT_NAME, [
        usdc
    ])
    await settleContract.waitForDeployment()
    console.log('Settle contract address:', await settleContract.getAddress())
}

async function main() {
    await deploySettleContract()
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})