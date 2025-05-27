import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { z } from "zod";
import request from "../utils/request";
import { JSONStringify } from "../utils/json-stringify";

export function registerGetHubListTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "listHubs",
    description: "List available hubs for Agent training.",
    parameters: z.object({}),
    execute: async () => {
      const hubList = await request("/hub/list");

      return {
        content: [
          {
            type: "text",
            text: JSONStringify(hubList),
          },
        ],
      };
    },
  });
}
