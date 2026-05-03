import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGIN: z.url(),
    FFMPEG_PATH: z.string().default("ffmpeg"),
    FFPROBE_PATH: z.string().default("ffprobe"),
    MAX_CONCURRENT_JOBS: z.coerce.number().int().min(1).max(10).default(2),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().default(9112),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
