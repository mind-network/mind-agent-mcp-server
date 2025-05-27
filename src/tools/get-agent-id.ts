import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { getChainId, readContract } from "@wagmi/core";
import { Address } from "abitype/zod";
import { z } from "zod";
import { AGENT_ABI, AGENT_ADDRESS } from "../utils/evm-schema";

export function registerGetAgentIdTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "getAgentId",
    description: "Retrieve the agent NFT ID for a given wallet.",
    parameters: z.object({
      address: Address.describe("Address to get FHE balance for."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (!chainId) {
        return {
          content: [{ type: "text", text: "Please specify a chain ID." }],
        };
      }

      const agentCount = await readContract(wagmiConfig, {
        abi: AGENT_ABI,
        address: AGENT_ADDRESS[chainId],
        functionName: "balanceOf",
        args: [args.address],
      });

      if (agentCount === 0n) {
        return {
          content: [
            {
              type: "text",
              text: "You haven't joined any agents.",
            },
          ],
        };
      }

      const agentId = await readContract(wagmiConfig, {
        abi: AGENT_ABI,
        address: AGENT_ADDRESS[chainId],
        functionName: "tokenOfOwnerByIndex",
        args: [args.address, 0n],
      });

      return {
        content: [
          {
            type: "text",
            text: agentId.toString(),
          },
        ],
      };
    },
  });
}
