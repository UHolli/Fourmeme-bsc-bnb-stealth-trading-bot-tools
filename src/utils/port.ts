import { execSync } from "node:child_process";
import net from "node:net";

import { logger } from "@/utils/logger";

export async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

export function killProcessOnPort(port: number): void {
  try {
    if (process.platform === "win32") {
      const output = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
      );

      const pids = new Set<string>();
      for (const line of output.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.includes("LISTENING")) {
          continue;
        }
        const parts = trimmed.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") {
          pids.add(pid);
        }
      }

      for (const pid of pids) {
        execSync(`taskkill /F /PID ${pid}`, {
          stdio: ["pipe", "pipe", "pipe"],
        });
        logger.warn(`Terminated process ${pid} occupying port ${port}`);
      }
    } else {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, {
        stdio: ["pipe", "pipe", "pipe"],
      });
    }
  } catch {
    logger.debug(`No process found on port ${port}`);
  }
}
