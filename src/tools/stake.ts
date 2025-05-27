import type { Config } from "@wagmi/core";
import type { ContentResult, FastMCP } from "fastmcp";

import { getChainId, readContract, signTypedData, simulateContract, writeContract } from "@wagmi/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { parseEther, TransactionExecutionError } from "viem";
import { z } from "zod";
import { AGENT_ABI, AGENT_ADDRESS, DAOTOKEN_ABI, FHE_TOKEN_ADDRESS } from "../utils/evm-schema";
import request from "../utils/request";
import { signRelayer } from "../utils/relayer-sign";
import { JSONStringify } from "../utils/json-stringify";
import { getAgentId } from "../utils/get-agent-id";

dayjs.extend(utc);

const permitTypes = {
  Permit: [
    {
      name: "owner",
      type: "address",
    },
    {
      name: "spender",
      type: "address",
    },
    {
      name: "value",
      type: "uint256",
    },
    {
      name: "nonce",
      type: "uint256",
    },
    {
      name: "deadline",
      type: "uint256",
    },
  ],
};

export function registerStakeTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "stakeFHE",
    description: "Stake FHE to create or fund an Agent.",
    parameters: z.object({
      address: z.string().describe("Address to stake from."),
      amount: z.string().describe("Amount to stake."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId === 228 || chainId === 192940) {
        return (await relayerStake(chainId, args.address as `0x${string}`, args.amount, wagmiConfig)) as ContentResult;
      }
      return (await stake(chainId, args.address as `0x${string}`, args.amount, wagmiConfig)) as ContentResult;
    },
  });
}

async function relayerStake(chainId: number, address: `0x${string}`, amount: string, wagmiConfig: Config) {
  const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
  if (chainId) {
    return {
      content: [{ type: "text", text: "Please specify a chain ID." }],
    };
  }
  const verifyingContract = FHE_TOKEN_ADDRESS[chainId];

  const domain = {
    name: "MindNetwork FHE Token",
    version: "1",
    chainId: chainId,
    verifyingContract,
  };

  const nonce = await readContract(wagmiConfig, {
    abi: DAOTOKEN_ABI,
    address: verifyingContract,
    functionName: "nonces",
    args: [address],
  });

  const deadline = dayjs().utc().unix() + 3600;

  const values = {
    owner: address,
    spender: AGENT_ADDRESS[chainId],
    value: parseEther(amount.toString()),
    nonce,
    deadline,
  };

  const permitSignature = await signTypedData(wagmiConfig, {
    domain,
    types: permitTypes,
    message: values,
    primaryType: "Permit",
  });

  const {
    signature,
    timestamp,
    nonce: _nonce,
  } = await signRelayer(wagmiConfig, chainId, {
    user: address,
    agentID: Number(agentId),
    hubID: 0,
    action: "Stake FHE",
    amount: parseEther(amount.toString()),
  });

  const res = (await request(`/relayer/agent/${chainId}/stake`, {
    method: "POST",
    data: {
      user: address,
      agentId: Number(agentId),
      hubId: 0,
      action: "Stake FHE",
      signature,
      timestamp,
      nonce: _nonce,
      amount: parseEther(amount.toString()).toString(),
      permitSignature,
      permitSpender: AGENT_ADDRESS[chainId],
      permitDeadline: deadline,
    },
  })) as any;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(res),
      },
    ],
  };
}

async function stake(chainId: number, address: `0x${string}`, amount: string, wagmiConfig: Config) {
  try {
    // permit
    const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
    const { request: approveRequest } = await simulateContract(wagmiConfig, {
      abi: DAOTOKEN_ABI,
      address: FHE_TOKEN_ADDRESS[chainId!],
      functionName: "approve",
      args: [AGENT_ADDRESS[chainId!], parseEther(amount)],
    });

    await writeContract(wagmiConfig, approveRequest);

    const { request } = await simulateContract(wagmiConfig, {
      abi: AGENT_ABI,
      functionName: "stake",
      address: AGENT_ADDRESS[chainId!],
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
