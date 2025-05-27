import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { disconnect } from "@wagmi/core";
import { z } from "zod";

export function registerDisconnectTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "disconnectWallet",
    description: "Disconnect the currently connected wallet.",
    parameters: z.object({}),
    execute: async () => {
      await disconnect(wagmiConfig);
      return {
        content: [
          {
            type: "text",
            text: "Disconnect successfully",
          },
        ],
      };
    },
  });
}
