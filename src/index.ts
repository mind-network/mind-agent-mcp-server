#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { registerTools } from "./tools/register-tools";
import { createWagmiConfig } from "./wagmi-config";

async function main() {
  try {
    const server = new FastMCP({
      name: "mind-agent-mcp-server",
      version: "1.0.0",
    });
    const wagmiConfig = await createWagmiConfig();

    registerTools(server, wagmiConfig);

    await server.start({
      transportType: "stdio",
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main();
