import { getChainId, simulateContract, writeContract, type Config } from "@wagmi/core";
import type { ContentResult, FastMCP } from "fastmcp";
import { parseEther, TransactionExecutionError } from "viem";
import { z } from "zod";
import { signRelayer } from "../utils/relayer-sign";
import request from "../utils/request";
import { AGENT_ABI, AGENT_ADDRESS } from "../utils/evm-schema";
import { JSONStringify } from "../utils/json-stringify";
import { getAgentId } from "../utils/get-agent-id";

export function registerUnstakeTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "unstakeFHE",
    description: "Unstake part of FHE from the Agent.",
    parameters: z.object({
      address: z.string().describe("Address to unstake from."),
      amount: z.number().describe("Amount to unstake."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId === 228 || chainId === 192940) {
        return (await relayerUnstake(
          chainId,
          args.address as `0x${string}`,
          args.amount.toString(),
          wagmiConfig
        )) as ContentResult;
      }
      return (await unstake(
        chainId,
        args.address as `0x${string}`,
        args.amount.toString(),
        wagmiConfig
      )) as ContentResult;
    },
  });
}

async function relayerUnstake(chainId: number, address: `0x${string}`, amount: string, wagmiConfig: Config) {
  const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
  const postData = {
    user: address,
    hubID: 0,
    agentID: Number(agentId),
    action: "Unstake FHE",
    amount: parseEther(amount.toString()),
  };

  const { signature, timestamp, nonce } = await signRelayer(wagmiConfig, chainId!, postData);

  const res = (await request.post(`/relayer/agent/${chainId}/unstake`, {
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
}

async function unstake(chainId: number, address: `0x${string}`, amount: string, wagmiConfig: Config) {
  try {
    const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
    const { request } = await simulateContract(wagmiConfig, {
      abi: AGENT_ABI,
      address: AGENT_ADDRESS[chainId!],
      functionName: "unstake",
      args: [BigInt(agentId), parseEther(amount)],
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
}
