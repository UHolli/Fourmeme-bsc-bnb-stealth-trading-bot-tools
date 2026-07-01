import type { WebSocket } from "ws";

import { MESSAGE_RESPONSE_TYPE } from "@/messaging/types";
import type {
  MessagePayload,
  MessageResult,
  MessageType,
} from "@/types/messages/ws";

export const MESSAGE_RESPONSE_TYPE_EXPORT = MESSAGE_RESPONSE_TYPE;

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
}

type SendOptions = { timeoutMs?: number };

export function createSocketMessageSender<
  TMap extends Record<string, { payload: unknown; result: unknown }>,
>(ws: WebSocket) {
  async function sendSocketMessage<K extends MessageType<TMap>>(
    type: K,
    payload: MessagePayload<TMap, K>,
    options: SendOptions = { timeoutMs: 30_000 },
  ): Promise<MessageResult<TMap, K>> {
    const { timeoutMs } = options;
    const id = generateId();
    const message = { id, type, payload };

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        removeResponseListener();
        ws.removeEventListener("error", errorHandler);
        ws.removeEventListener("close", cleanup);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (timeoutMs) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`WebSocket response timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }

      const removeResponseListener = addSocketMessageResponseListener(
        ws,
        (responseMessage) => {
          const { payload: responsePayload } = responseMessage;
          if (responsePayload.requestId !== id) {
            return;
          }

          const { result, error } = responsePayload;
          if (error) {
            reject(new Error(error));
          } else {
            resolve(result as MessageResult<TMap, K>);
          }
          cleanup();
        },
      );

      const errorHandler = () => {
        cleanup();
        reject(new Error("WebSocket error occurred"));
      };

      ws.addEventListener("error", errorHandler);
      ws.addEventListener("close", cleanup);

      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        cleanup();
        reject(new Error("WebSocket is not open"));
      }
    });
  }

  return { sendSocketMessage };
}

function addSocketMessageResponseListener(
  ws: WebSocket,
  listener: (message: {
    type: typeof MESSAGE_RESPONSE_TYPE;
    payload: { requestId: string; result?: unknown; error?: string };
  }) => void | Promise<void>,
): () => void {
  const messageListener = async (event: WebSocket.MessageEvent) => {
    const data =
      typeof event.data === "string"
        ? event.data
        : event.data.toString();
    const message = JSON.parse(data) as {
      type: string;
      payload: { requestId: string; result?: unknown; error?: string };
    };

    if (message.type !== MESSAGE_RESPONSE_TYPE) {
      return;
    }

    await listener({
      type: MESSAGE_RESPONSE_TYPE,
      payload: message.payload,
    });
  };

  ws.addEventListener("message", messageListener);
  return () => ws.removeEventListener("message", messageListener);
}
