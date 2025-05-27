import type { TypedData } from "viem";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { Config } from "@wagmi/core";
import { AGENT_SIGVERIFY_ADDRESS } from "./evm-schema";

import { signTypedData } from "@wagmi/core";

dayjs.extend(utc);

const types = {
  Message: [
    { name: "user", type: "address" },
    { name: "agentID", type: "uint256" },
    { name: "hubID", type: "uint256" },
    { name: "action", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const satisfies TypedData;

type Payload = {
  user: string;
  agentID: number;
  hubID: number;
  action: string;
  amount: bigint;
};

export async function signRelayer(wagmiConfig: Config, chainId: number, payload: Payload) {
  const verifyingContract = AGENT_SIGVERIFY_ADDRESS[chainId];

  const domain = {
    name: "mindnetwork.xyz",
    version: "1",
    chainId: chainId,
    verifyingContract,
  };

  const timestamp = dayjs().utc().unix();

  const signature = await signTypedData(wagmiConfig, {
    domain,
    types,
    message: {
      user: payload.user as `0x${string}`,
      agentID: BigInt(payload.agentID),
      hubID: BigInt(payload.hubID),
      action: payload.action,
      amount: payload.amount,
      timestamp: BigInt(timestamp),
      nonce: BigInt(timestamp),
    },
    primaryType: "Message",
  });

  return { signature, timestamp, nonce: timestamp };
}
