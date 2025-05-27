import { getChainId, simulateContract, writeContract, type Config } from "@wagmi/core";
import type { ContentResult, FastMCP } from "fastmcp";
import { z } from "zod";
import { signRelayer } from "../utils/relayer-sign";
import request from "../utils/request";
import { AGENT_ABI, AGENT_ADDRESS } from "../utils/evm-schema";
import { JSONStringify } from "../utils/json-stringify";
import { TransactionExecutionError } from "viem";

export function registerClaimRewardTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "claimReward",
    description: "Claim earned FHE rewards from hub training.",
    parameters: z.object({
      address: z.string().describe("Address to claim reward from."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId === 228 || chainId === 192940) {
        return (await relayerClaimReward(chainId, args.address as `0x${string}`)) as ContentResult;
      }
      return (await claimReward(chainId, args.address as `0x${string}`)) as ContentResult;
    },
  });

  async function relayerClaimReward(chainId: number, address: `0x${string}`) {
    const postData = {
      user: address!,
      hubID: 0,
      agentID: 0,
      action: "claim reward",
      amount: BigInt(0),
    };

    const { signature, timestamp, nonce } = await signRelayer(wagmiConfig, chainId!, postData);
    const res = (await request.post(`/relayer/agent/${chainId}/claim`, {
      user: postData.user,
      agentId: postData.agentID,
      hubId: postData.hubID,
      action: postData.action,
      signature,
      timestamp,
      nonce,
      amount: postData.amount.toString(),
    })) as { id: number };

    return { content: [{ type: "text" as const, text: res.id + "" }] };
  }

  async function claimReward(chainId: number, address: `0x${string}`) {
    try {
      const { request } = await simulateContract(wagmiConfig, {
        abi: AGENT_ABI,
        address: AGENT_ADDRESS[chainId!],
        functionName: "claimReward",
        args: [address as `0x${string}`],
      });

      const hash = await writeContract(wagmiConfig, request);

      return {
        content: [{ type: "text", text: JSONStringify({ hash }) }],
      };
    } catch (error) {
      if (error instanceof TransactionExecutionError) {
        return {
          content: [
            {
              type: "text" as const,
              text: error.cause.message,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: (error as Error).message,
          },
        ],
      };
    }
  }
}
