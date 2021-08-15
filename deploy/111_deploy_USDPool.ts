import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const MuneUSDPool = await getOrNull("MuneUSDPool")
  if (MuneUSDPool) {
    log(`reusing "MuneUSDPool" at ${MuneUSDPool.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("DAI")).address,
      (await get("USDC")).address,
      (await get("USDT")).address,
    ]
    const TOKEN_DECIMALS = [18, 6, 6]
    const LP_TOKEN_NAME = "MUNE USD"
    const LP_TOKEN_SYMBOL = "uMUNE"
    const INITIAL_A = 200 //200
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 50e8
    const WITHDRAW_FEE = 0

    const receipt = await execute(
      "SwapDeployerV1",
      { from: deployer, log: true },
      "deploy",
      (
        await get("SwapFlashLoanV1")
      ).address,
      TOKEN_ADDRESSES,
      TOKEN_DECIMALS,
      LP_TOKEN_NAME,
      LP_TOKEN_SYMBOL,
      INITIAL_A,
      SWAP_FEE,
      ADMIN_FEE,
      WITHDRAW_FEE,
      (
        await get("LPTokenV1")
      ).address,
    )

    const newPoolEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewSwapPool",
    )
    const usdSwapAddress = newPoolEvent["args"]["swapAddress"]
    log(
      `deployed USD pool clone (targeting "SwapFlashLoanV1") at ${usdSwapAddress}`,
    )
    await save("MuneUSDPool", {
      abi: (await get("SwapFlashLoanV1")).abi,
      address: usdSwapAddress,
    })
  }

  const lpTokenAddress = (await read("MuneUSDPool", "swapStorage")).lpToken
  log(`USD pool LP Token at ${lpTokenAddress}`)

  await save("MuneUSDPoolLPToken", {
    abi: (await get("TBTC")).abi, // Generic ERC20 ABI
    address: lpTokenAddress,
  })
}
export default func
func.tags = ["USDPool"]
func.dependencies = [
  "SwapUtils",
  "SwapDeployer",
  "SwapFlashLoan",
  "USDPoolTokens",
]
