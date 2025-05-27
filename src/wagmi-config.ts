import type { Chain } from "viem";
import { kvsMemoryStorage } from "@kvs/memorystorage";
import { createConfig, createStorage, http } from "@wagmi/core";
import { createClient } from "viem";

export const mindtestnet = {
  id: 192940,
  name: "MindTestChain",
  nativeCurrency: { name: "mind native token", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.mindnetwork.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "MindChain Explorer",
      url: "https://explorer-testnet.mindnetwork.xyz",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const mindnet = {
  id: 228,
  name: "MindChain",
  nativeCurrency: { name: "mind native token", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-mainnet.mindnetwork.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "MindChain Explorer",
      url: "https://explorer.mindnetwork.xyz",
    },
  },
} as const satisfies Chain;

export async function createWagmiConfig() {
  const kvsStorage = await kvsMemoryStorage({
    name: "wagmi-storage",
    version: 1,
  });

  const storage = {
    getItem: async (key: string) => {
      const value = await kvsStorage.get(key);
      return value?.toString();
    },
    setItem: async (key: string, value: string) => {
      kvsStorage.set(key, value);
    },
    removeItem: async (key: string) => {
      kvsStorage.delete(key);
    },
  };

  return createConfig({
    chains: [mindtestnet, mindnet],
    ssr: true,
    storage: createStorage({ storage }),
    client({ chain }) {
      return createClient({
        chain,
        transport: http(),
      });
    },
  });
}
