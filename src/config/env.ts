import { z } from "zod";

const envSchema = z.object({
  WS_PORT: z.coerce.number().int().min(1).max(65535).default(9009),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
  REDIS_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
  REDIS_KEY_PREFIX: z.string().default("browsermcp:"),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  REDIS_MAX_RETRIES: z.coerce.number().int().min(0).default(10),
  REDIS_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | undefined;

export function loadEnv(overrides: Partial<Record<string, string>> = {}): EnvConfig {
  const raw = { ...process.env, ...overrides };
  cachedEnv = envSchema.parse(raw);
  return cachedEnv;
}

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    return loadEnv();
  }
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = undefined;
}
