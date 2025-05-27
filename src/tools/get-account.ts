import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { getAccount } from "@wagmi/core";
import { z } from "zod";
import { JSONStringify } from "../utils/json-stringify";

export function registerGetAccountTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "getAccountInfo",
    description:
      "Get address and chain ID of connected wallet. Valid chains: Mind Network Mainnet(228), BNB Smart Chain(56), Mind Network Testnet(192940).",
    parameters: z.object({}),
    execute: async (_, { log }) => {
      const result = getAccount(wagmiConfig);
      log.debug("getAccount", JSONStringify(result));
      return {
        content: [
          {
            type: "text",
            text: JSONStringify({
              address: result.address,
              addresses: result.addresses,
              chainId: result.chainId,
              status: result.status,
            }),
          },
        ],
      };
    },
  });
}
