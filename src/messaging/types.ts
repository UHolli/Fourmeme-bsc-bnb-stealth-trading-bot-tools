export type { MessagePayload, MessageType, MessageResult } from "@/types/messages/ws";

export const MESSAGE_RESPONSE_TYPE = "messageResponse" as const;

export interface SocketRequestMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface SocketResponsePayload<T = unknown> {
  requestId: string;
  result?: T;
  error?: string;
}

export interface SocketResponseMessage {
  type: typeof MESSAGE_RESPONSE_TYPE;
  payload: SocketResponsePayload;
}
