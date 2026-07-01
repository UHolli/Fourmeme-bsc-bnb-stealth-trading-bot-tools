#!/usr/bin/env node
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { program } from "commander";

import { appConfig } from "@/config/app.config";
import { getWsPort, loadEnv } from "@/config/index";
import {
  initializePersistence,
  registerShutdownHandlers,
} from "@/persistence/index";
import type { Resource } from "@/resources/resource";
import { createServerWithTools } from "@/server";
import * as common from "@/tools/common";
import * as custom from "@/tools/custom";
import * as snapshot from "@/tools/snapshot";
import type { Tool } from "@/tools/tool";
import { logger } from "@/utils/logger";

import packageJSON from "../package.json";

function setupExitWatchdog(server: Server): void {
  process.stdin.on("close", () => {
    logger.info("Stdin closed, initiating shutdown");
    setTimeout(() => process.exit(0), 15_000);
    void server.close().then(() => process.exit(0));
  });
}

const commonTools: Tool[] = [common.pressKey, common.wait];

const customTools: Tool[] = [custom.getConsoleLogs, custom.screenshot];

const snapshotTools: Tool[] = [
  common.navigate(true),
  common.goBack(true),
  common.goForward(true),
  snapshot.snapshot,
  snapshot.click,
  snapshot.drag,
  snapshot.hover,
  snapshot.type,
  snapshot.selectOption,
  ...commonTools,
  ...customTools,
];

const resources: Resource[] = [];

async function createServer(): Promise<Server> {
  const persistence = await initializePersistence();
  registerShutdownHandlers(persistence);

  return createServerWithTools({
    name: appConfig.name,
    version: packageJSON.version,
    tools: snapshotTools,
    resources,
    wsPort: getWsPort(),
    sessionStore: persistence.sessionStore,
  });
}

program
  .version(`Version ${packageJSON.version}`)
  .name(packageJSON.name)
  .description("MCP server for browser automation")
  .action(async () => {
    loadEnv();
    logger.info(`Starting ${appConfig.name} v${packageJSON.version}`);

    const server = await createServer();
    setupExitWatchdog(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info(`WebSocket bridge listening on port ${getWsPort()}`);
  });

program.parse(process.argv);
