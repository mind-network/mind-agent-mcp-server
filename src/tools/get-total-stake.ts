import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { getChainId, readContract } from "@wagmi/core";
import { Address } from "abitype/zod";
import { z } from "zod";
import { AGENT_ABI, AGENT_ADDRESS } from "../utils/evm-schema";
import { formatEther } from "viem";
import { getAgentId } from "../utils/get-agent-id";

export function registerGetTotalStakeTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "getStakeAmount",
    description: "Get total staked FHE for a wallet’s Agent.",
    parameters: z.object({
      address: Address.describe("Address to get FHE balance for."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      const agentId = await getAgentId(args.address as `0x${string}`, chainId, wagmiConfig);
      if (!chainId || agentId) {
        return {
          content: [{ type: "text", text: "Please specify a chain ID and agent ID." }],
        };
      }

      const amount = await readContract(wagmiConfig, {
        abi: AGENT_ABI,
        address: AGENT_ADDRESS[chainId],
        functionName: "stakeAmount",
        args: [agentId],
      });

      return {
        content: [
          {
            type: "text",
            text: formatEther(amount) + " FHE",
          },
        ],
      };
    },
  });
}
