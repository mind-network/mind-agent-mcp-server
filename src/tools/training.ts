import { getChainId, readContract, simulateContract, writeContract, type Config } from "@wagmi/core";
import type { ContentResult, FastMCP } from "fastmcp";
import { z } from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import request from "../utils/request";
import { AGENT_ABI, AGENT_ADDRESS } from "../utils/evm-schema";
import { signRelayer } from "../utils/relayer-sign";
import { JSONStringify } from "../utils/json-stringify";
import { TransactionExecutionError } from "viem";
import { getAgentId } from "../utils/get-agent-id";

dayjs.extend(utc);

export function registerTrainingTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "trainInHub",
    description: "Start training in a selected hub (if idle).",
    parameters: z.object({
      address: z.string().describe("Address to tranning from."),
      hubId: z.number().describe("Hub ID to tranning."),
      needSign: z.boolean().optional().describe("Some hub need sign"),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId === 228 || chainId === 192940) {
        return (await relayerTrainInHub(
          chainId,
          args.address as `0x${string}`,
          args.hubId,
          args.needSign!,
          wagmiConfig
        )) as ContentResult;
      }
      return (await trainInHub(
        chainId,
        args.address as `0x${string}`,
        args.hubId,
        args.needSign!,
        wagmiConfig
      )) as ContentResult;
    },
  });

  server.addTool({
    name: "exitHub",
    description: "Stop training in the current hub.",
    parameters: z.object({
      address: z.string().describe("Address to exit from."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId === 228 || chainId === 192940) {
        return (await relayerExitHub(chainId, args.address as `0x${string}`, wagmiConfig)) as ContentResult;
      }
      return (await exitHub(chainId, args.address as `0x${string}`, wagmiConfig)) as ContentResult;
    },
  });

  server.addTool({
    name: "switchHub",
    description: "Exit current hub and start training in another.",
    parameters: z.object({
      address: z.string().describe("Address to tranning from."),
      hubId: z.number().describe("Hub ID to tranning."),
      needSign: z.boolean().optional().describe("Some hub need sign"),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      if (chainId === 228 || chainId === 192940) {
        return (await relayerSwitchHub(
          chainId,
          args.address as `0x${string}`,
          args.hubId,
          args.needSign!,
          wagmiConfig
        )) as ContentResult;
      }
      return (await switchHub(
        chainId,
        args.address as `0x${string}`,
        args.hubId,
        args.needSign!,
        wagmiConfig
      )) as ContentResult;
    },
  });

  server.addTool({
    name: "getCurrentHub",
    description: "Get the hub where the Agent is currently training.",
    parameters: z.object({
      address: z.string().describe("Address to get current hub from."),
    }),
    execute: async (args) => {
      const chainId = getChainId(wagmiConfig);
      const agentId = await getAgentId(args.address as `0x${string}`, chainId, wagmiConfig);
      const currentHub = await readContract(wagmiConfig, {
        abi: AGENT_ABI,
        address: AGENT_ADDRESS[chainId!],
        functionName: "currentHub",
        args: [BigInt(agentId)],
      });

      return { content: [{ type: "text", text: currentHub.toString() }] };
    },
  });
}

async function relayerSwitchHub(
  chainId: number,
  address: `0x${string}`,
  hubId: number,
  needSign: boolean,
  wagmiConfig: Config
) {
  const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
  const postData = {
    user: address!,
    hubID: hubId,
    agentID: Number(agentId),
    action: "Switch to another Hub",
    amount: BigInt(0),
  };
  const sigTs = dayjs().utc().unix();
  let delegateSig = "0x";
  if (needSign) {
    delegateSig = await request.post("/hub/verify", {
      tokenId: Number(agentId),
      hubId: hubId,
      sigTs,
      address: AGENT_ADDRESS[chainId!],
      chainId: chainId!,
    });
  }
  const { signature, timestamp, nonce } = await signRelayer(wagmiConfig, chainId!, postData);
  const res = (await request.post(`/relayer/agent/${chainId}/switch`, {
    user: postData.user,
    agentId: postData.agentID,
    hubId: postData.hubID,
    action: postData.action,
    signature,
    timestamp,
    nonce,
    amount: postData.amount.toString(),
    delegateSig,
    delegateSigTs: sigTs,
    chainId: chainId,
  })) as { id: number };

  return { content: [{ type: "text", text: res.id + "" }] };
}

async function switchHub(
  chainId: number,
  address: `0x${string}`,
  hubId: number,
  needSign: boolean,
  wagmiConfig: Config
) {
  try {
    const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
    const sigTs = dayjs().utc().unix();
    let delegateSig = "0x" as `0x${string}`;
    if (needSign) {
      delegateSig = await request.post("/hub/verify", {
        tokenId: Number(agentId),
        hubId: hubId,
        sigTs,
        address: AGENT_ADDRESS[chainId!],
        chainId: chainId!,
      });
    }

    const { request: req } = await simulateContract(wagmiConfig, {
      abi: AGENT_ABI,
      functionName: "switchHub",
      address: AGENT_ADDRESS[chainId!],
      args: [BigInt(agentId), BigInt(hubId), delegateSig, BigInt(sigTs)],
    });

    const result = await writeContract(wagmiConfig, req);

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

async function relayerTrainInHub(
  chainId: number,
  address: `0x${string}`,
  hubId: number,
  needSign: boolean,
  wagmiConfig: Config
) {
  const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);

  const postData = {
    user: address!,
    hubID: hubId,
    agentID: Number(agentId),
    action: "Delegate to Hub",
    amount: BigInt(0),
  };

  const sigTs = dayjs().utc().unix();
  let delegateSig = "0x";
  if (needSign) {
    delegateSig = await request.post("/hub/verify", {
      tokenId: Number(agentId),
      hubId: hubId,
      sigTs,
      address: AGENT_ADDRESS[chainId!],
      chainId: chainId!,
    });
  }

  const { signature, timestamp, nonce } = await signRelayer(wagmiConfig, chainId!, postData);
  const res = (await request.post(`/relayer/agent/${chainId}/delegate`, {
    user: postData.user,
    agentId: postData.agentID,
    hubId: postData.hubID,
    action: postData.action,
    signature,
    timestamp,
    nonce,
    amount: postData.amount.toString(),
    delegateSig,
    delegateSigTs: sigTs,
    chainId: chainId!,
  })) as { id: number };

  return { content: [{ type: "text", text: res.id + "" }] };
}

async function trainInHub(
  chainId: number,
  address: `0x${string}`,
  hubId: number,
  needSign: boolean,
  wagmiConfig: Config
) {
  try {
    const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
    const sigTs = dayjs().utc().unix();
    let delegateSig: `0x${string}` = "0x";
    if (needSign) {
      delegateSig = (await request.post("/hub/verify", {
        tokenId: Number(agentId),
        hubId: hubId,
        sigTs,
        address: AGENT_ADDRESS[chainId!],
        chainId: chainId!,
      })) as `0x${string}`;
    }

    const { request: req } = await simulateContract(wagmiConfig, {
      abi: AGENT_ABI,
      functionName: "delegate",
      address: AGENT_ADDRESS[chainId!],
      args: [BigInt(agentId), BigInt(hubId), delegateSig, BigInt(sigTs)],
    });

    const result = await writeContract(wagmiConfig, req);

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

async function relayerExitHub(chainId: number, address: `0x${string}`, wagmiConfig: Config) {
  const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
  const postData = {
    user: address!,
    hubID: 0,
    agentID: Number(agentId),
    action: "Exit current Hub",
    amount: BigInt(0),
  };

  const { signature, timestamp, nonce } = await signRelayer(wagmiConfig, chainId!, postData);

  const res = (await request.post(`/relayer/agent/${chainId}/undelegate`, {
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

async function exitHub(chainId: number, address: `0x${string}`, wagmiConfig: Config) {
  try {
    const chainId = getChainId(wagmiConfig);
    const agentId = await getAgentId(address as `0x${string}`, chainId, wagmiConfig);
    const { request } = await simulateContract(wagmiConfig, {
      abi: AGENT_ABI,
      functionName: "exitCurrentHub",
      address: AGENT_ADDRESS[chainId!],
      args: [BigInt(agentId)],
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
