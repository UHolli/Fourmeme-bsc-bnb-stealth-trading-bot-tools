import { getEnv, loadEnv, resetEnvCache } from "@/config/env";
import { mcpConfig } from "@/config/mcp.config";

export { getEnv, loadEnv, resetEnvCache };

export function getWsPort(): number {
  return getEnv().WS_PORT ?? mcpConfig.defaultWsPort;
}

export function isRedisEnabled(): boolean {
  return getEnv().REDIS_ENABLED;
}

export function getRedisConfig() {
  const env = getEnv();
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    keyPrefix: env.REDIS_KEY_PREFIX,
    connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
    maxRetries: env.REDIS_MAX_RETRIES,
    sessionTtlSeconds: env.REDIS_SESSION_TTL_SECONDS,
  };
}
