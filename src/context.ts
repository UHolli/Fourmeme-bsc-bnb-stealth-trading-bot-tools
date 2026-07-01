import { createSocketMessageSender } from "@/messaging/ws/sender";
import { mcpConfig } from "@/config/mcp.config";
import type {
  MessagePayload,
  MessageType,
} from "@/types/messages/ws";
import type { SocketMessageMap } from "@/types/messages/ws";
import type { WebSocket } from "ws";

const NO_CONNECTION_MESSAGE =
  "No connection to browser extension. In order to proceed, you must first connect a tab by clicking the Browser MCP extension icon in the browser toolbar and clicking the 'Connect' button.";

export class Context {
  private _ws: WebSocket | undefined;

  get ws(): WebSocket {
    if (!this._ws) {
      throw new Error(NO_CONNECTION_MESSAGE);
    }
    return this._ws;
  }

  set ws(ws: WebSocket) {
    this._ws = ws;
  }

  hasWs(): boolean {
    return !!this._ws;
  }

  async sendSocketMessage<T extends MessageType<SocketMessageMap>>(
    type: T,
    payload: MessagePayload<SocketMessageMap, T>,
    options: { timeoutMs?: number } = { timeoutMs: 30_000 },
  ) {
    const { sendSocketMessage } =
      createSocketMessageSender<SocketMessageMap>(this.ws);

    try {
      return await sendSocketMessage(type, payload, options);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === mcpConfig.errors.noConnectedTab
      ) {
        throw new Error(NO_CONNECTION_MESSAGE);
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this._ws) {
      return;
    }
    await new Promise<void>((resolve) => {
      this._ws?.once("close", () => resolve());
      this._ws?.close();
    });
    this._ws = undefined;
  }
}
