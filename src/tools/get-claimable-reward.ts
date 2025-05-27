import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { getChainId, readContract } from "@wagmi/core";
import { Address } from "abitype/zod";
import { z } from "zod";
import { DAO_INSPECTOR_ABI, DAO_INSPECTOR_ADDRESS } from "../utils/evm-schema";
import { formatEther } from "viem";

export function registerGetClaimableRewardTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "getClaimableReward",
    description: "Fetch FHE rewards that can be claimed by an address.",
    parameters: z.object({
      address: Address.describe("fetch FHE rewards that can be claimed by an address."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (!chainId) {
        return { content: [{ type: "text", text: "Please specify a chain ID." }] };
      }
      const result = await readContract(wagmiConfig, {
        abi: DAO_INSPECTOR_ABI,
        address: DAO_INSPECTOR_ADDRESS[chainId],
        functionName: "getUserClaimableRewards",
        args: [args.address],
      });
      return {
        content: [
          {
            type: "text",
            text: formatEther(result) + " FHE",
          },
        ],
      };
    },
  });
}
