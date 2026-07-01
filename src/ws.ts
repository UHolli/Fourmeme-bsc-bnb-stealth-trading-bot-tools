import { WebSocketServer } from "ws";

import { mcpConfig } from "@/config/mcp.config";
import { wait } from "@/utils/async";
import { isPortInUse, killProcessOnPort } from "@/utils/port";

export async function createWebSocketServer(
  port: number = mcpConfig.defaultWsPort,
): Promise<WebSocketServer> {
  killProcessOnPort(port);

  while (await isPortInUse(port)) {
    await wait(100);
  }

  return new WebSocketServer({ port });
}

export async function closeWebSocketServer(
  wss: WebSocketServer,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    wss.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
