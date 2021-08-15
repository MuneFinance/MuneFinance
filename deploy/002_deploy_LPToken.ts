import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isTestNetwork } from "../utils/network"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { deploy, execute, getOrNull, log } = deployments
  const { libraryDeployer } = await getNamedAccounts()

  if (isTestNetwork(await getChainId())) {
    await deploy("LPTokenV1", {
      from: libraryDeployer,
      log: true,
      skipIfAlreadyDeployed: true,
    })
  }

  const lpToken = await getOrNull("LPTokenV1")
  if (lpToken) {
    log(`reusing "LPTokenV1" at ${lpToken.address}`)
  } else {
    await deploy("LPTokenV1", {
      from: libraryDeployer,
      log: true,
      skipIfAlreadyDeployed: true,
    })

    await execute(
      "LPTokenV1",
      { from: libraryDeployer, log: true },
      "initialize",
      "Mune LP Token V1 (Target)",
      "MuneLPTokenV1Target",
    )
  }
}
export default func
func.tags = ["LPToken"]
