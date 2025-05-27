import type { Config } from "@wagmi/core";
import type { FastMCP } from "fastmcp";
import { connect } from "@wagmi/core";
import { imageContent } from "fastmcp";
import QRCode from "qrcode";
import { z } from "zod";
import { metaMask } from "../connectors/metamask";
import { JSONStringify } from "../utils/json-stringify";

export function registerConnectTools(server: FastMCP, wagmiConfig: Config): void {
  server.addTool({
    name: "connectWallet",
    description: "Connect to MetaMask for interacting with Mind Network.",
    parameters: z.object({}),
    execute: async (_, { log }) => {
      const uri = (await getMetaMaskConnectURI(log, wagmiConfig)) as string;

      const qrCode = await QRCode.toDataURL(uri, {
        width: 400,
      });
      return imageContent({
        url: qrCode,
      });
    },
  });
}

async function getMetaMaskConnectURI(log: any, wagmiConfig: Config) {
  return new Promise((resolve, reject) => {
    const connectorFn = metaMask({
      headless: true,
    });
    const connector = wagmiConfig._internal.connectors.setup(connectorFn);
    connector.emitter.on("message", (payload) => {
      if (payload.type === "display_uri") {
        const uri = payload.data;
        resolve(uri);
      }
    });
    connector.emitter.on("connect", (payload) => {
      log.debug("connect success!", payload.accounts);
    });
    connector.emitter.on("error", (payload) => {
      log.error(payload.error);
    });

    connect(wagmiConfig, { connector }).catch((error) => {
      log.error("connect error: ", error);
      log.error(error.stack);
      reject(error);
    });
  });
}
