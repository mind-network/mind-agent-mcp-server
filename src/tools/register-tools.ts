import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { registerGetFheBalanceTools } from "./get-fhe-balance";
import {
  registerConnectTools,
  registerDisconnectTools,
  registerGetAccountTools,
  registerStakeTools,
  registerSwitchChainTools,
  registerGetClaimableRewardTools,
  registerGetAgentIdTools,
  registerGetTotalStakeTools,
  registerGetChainIdTools,
  registerGetHubListTools,
  // registerBurnTools,
  registerClaimRewardTools,
  registerUnstakeTools,
  registerTrainingTools,
} from "./index";

export function registerTools(server: FastMCP, wagmiConfig: Config) {
  registerConnectTools(server, wagmiConfig);
  registerDisconnectTools(server, wagmiConfig);
  registerGetAccountTools(server, wagmiConfig);
  registerGetFheBalanceTools(server, wagmiConfig);
  registerStakeTools(server, wagmiConfig);
  registerSwitchChainTools(server, wagmiConfig);
  registerGetClaimableRewardTools(server, wagmiConfig);
  registerGetAgentIdTools(server, wagmiConfig);
  registerGetTotalStakeTools(server, wagmiConfig);
  registerGetChainIdTools(server, wagmiConfig);
  registerGetHubListTools(server, wagmiConfig);
  // registerBurnTools(server, wagmiConfig);
  registerClaimRewardTools(server, wagmiConfig);
  registerUnstakeTools(server, wagmiConfig);
  registerTrainingTools(server, wagmiConfig);
}
