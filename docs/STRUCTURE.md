# Project Structure

This document explains the repository layout and the reasoning behind key structural decisions made during the production fork.

## Directory Layout

```
src/
├── config/          Environment and application configuration
├── messaging/       WebSocket RPC protocol layer
├── persistence/     Optional Redis-backed session storage
├── resources/       MCP resource type definitions
├── tools/           Browser automation tool handlers
├── types/           Shared Zod schemas and message type maps
└── utils/           Cross-cutting utilities (logging, errors, ports)
```

## Separation of Concerns

| Layer | Responsibility | Depends On |
|-------|---------------|------------|
| **config** | Parse and validate environment variables | zod |
| **types** | Define tool schemas and WebSocket message contracts | zod |
| **messaging** | Correlate WebSocket request/response pairs | types, ws |
| **tools** | Implement MCP tool handlers | context, types |
| **persistence** | Optional Redis session metadata | config, ioredis |
| **server** | Wire MCP protocol to tools and WebSocket | all layers |

## Key Decisions

### Standalone Module Extraction

The upstream repository depended on private monorepo packages (`@repo/*`, `@r2r/*`). These were extracted into local modules under `src/config`, `src/types`, and `src/messaging` so the server builds independently without workspace tooling.

### Optional Redis Persistence

Redis is disabled by default (`REDIS_ENABLED=false`). When enabled, the session store records:

- Extension connection/disconnection timestamps
- Last tool invoked and cumulative call count

This keeps the core server functional without Redis while allowing operational visibility in production deployments.

### Stderr-Only Logging

MCP uses stdout for the JSON-RPC transport. All logging goes through `src/utils/logger.ts` to stderr, preventing protocol corruption.

### Typed End-to-End Messaging

`SocketMessageMap` in `src/types/messages/ws.ts` types every WebSocket message from server to extension. Tool handlers cannot send mistyped payloads at compile time.

## Adding New Tools

1. Define the Zod schema in `src/types/mcp/tool.ts`.
2. Add the message type to `SocketMessageMap` in `src/types/messages/ws.ts`.
3. Implement the handler in the appropriate file under `src/tools/`.
4. Register the tool in `src/index.ts`.

## Testing Strategy

- **Unit tests** in `tests/` cover configuration parsing, error utilities, and Redis session logic with mocked clients.
- **Integration tests** require a running Chrome extension and are not included in CI.
- Run the full suite with `npm run validate`.
