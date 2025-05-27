import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { getBalance, getChainId } from "@wagmi/core";
import { Address } from "abitype/zod";
import { z } from "zod";
import { JSONStringify } from "../utils/json-stringify";
import { FHE_TOKEN_ADDRESS } from "../utils/evm-schema";

export function registerGetFheBalanceTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "getFheBalance",
    description: "Get available FHE token balance for a wallet.",
    parameters: z.object({
      address: Address.describe("Address to get FHE balance for."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId) {
        return {
          content: [{ type: "text", text: "Please specify a chain ID." }],
        };
      }
      const token = FHE_TOKEN_ADDRESS[chainId];
      const result = await getBalance(wagmiConfig, { ...args, token });
      return {
        content: [
          {
            type: "text",
            text: JSONStringify(result),
          },
        ],
      };
    },
  });
}
