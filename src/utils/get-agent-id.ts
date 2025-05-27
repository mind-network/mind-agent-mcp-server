import { readContract, type Config } from "@wagmi/core";
import { AGENT_ABI, AGENT_ADDRESS } from "./evm-schema";

export async function getAgentId(address: `0x${string}`, chainId: number, wagmiConfig: Config): Promise<bigint> {
  const agentCount = await readContract(wagmiConfig, {
    abi: AGENT_ABI,
    address: AGENT_ADDRESS[chainId],
    functionName: "balanceOf",
    args: [address],
  });

  if (agentCount === 0n) {
    return 0n;
  }

  const agentId = await readContract(wagmiConfig, {
    abi: AGENT_ABI,
    address: AGENT_ADDRESS[chainId],
    functionName: "tokenOfOwnerByIndex",
    args: [address, 0n],
  });

  return agentId; // Return the agent coun
}
