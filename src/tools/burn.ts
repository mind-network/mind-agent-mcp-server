import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { signRelayer } from "../utils/relayer-sign";
import request from "../utils/request";
import { getChainId, simulateContract, writeContract } from "@wagmi/core";
import { AGENT_ABI, AGENT_ADDRESS } from "../utils/evm-schema";
import { JSONStringify } from "../utils/json-stringify";
import { TransactionExecutionError } from "viem";
import { getAgentId } from "../utils/get-agent-id";

export function registerBurnTools(server: FastMCP, wagmiConfig: Config) {
  server.addTool({
    name: "relayer-burn",
    description: "Burn agent use relayer on mind mainnet or mind testnet",
    parameters: z.object({
      address: z.string().describe("Address to burn from."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      const agentId = await getAgentId(args.address as `0x${string}`, chainId, wagmiConfig);
      const postData = {
        user: args.address!,
        hubID: 0,
        agentID: Number(agentId),
        action: "Destroy Agent",
        amount: BigInt(0),
      };

      const { signature, timestamp, nonce } = await signRelayer(wagmiConfig, chainId!, postData);

      const res = (await request.post(`/relayer/agent/${chainId}/burn`, {
        user: postData.user,
        agentId: postData.agentID,
        hubId: postData.hubID,
        action: postData.action,
        signature,
        timestamp,
        nonce,
        amount: postData.amount.toString(),
      })) as { id: number };

      return { content: [{ type: "text", text: res.id + "" }] };
    },
  });

  server.addTool({
    name: "burn",
    description: "Burn agent no relayer on bnb testnet or bnb mainnet",
    parameters: z.object({
      address: z.string().describe("Address to burn from."),
    }),
    execute: async (args) => {
      try {
        const chainId = getChainId(wagmiConfig);
        const agentId = await getAgentId(args.address as `0x${string}`, chainId, wagmiConfig);
        const { request } = await simulateContract(wagmiConfig, {
          abi: AGENT_ABI,
          address: AGENT_ADDRESS[chainId!],
          functionName: "burn",
          args: [agentId],
        });

        const result = await writeContract(wagmiConfig, request);

        return {
          content: [{ type: "text", text: JSONStringify({ hash: result }) }],
        };
      } catch (error) {
        if (error instanceof TransactionExecutionError) {
          return {
            content: [
              {
                type: "text",
                text: error.cause.message,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: (error as Error).message,
            },
          ],
        };
      }
    },
  });
}
