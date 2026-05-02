import { type OutputFormat, type QualityLevel, getAllowedOutputs } from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import { z } from "zod";

import { normalizeError } from "./conversion/errors";
import { getRuntimeHealth } from "./conversion/runtime";
import {
  completeUpload,
  createDownloadStream,
  initConversionService,
  readProgress,
  saveChunk,
} from "./conversion/service";

const app = new Hono();

const completeUploadSchema = z.object({
  uploadId: z.string().min(1),
  outputFormat: z.enum(["mp4", "mp3", "jpeg", "jpg", "png", "webp"]),
  quality: z.enum(["low", "medium", "high"]),
});

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

const runtimeHealth = getRuntimeHealth(env.FFMPEG_PATH, env.FFPROBE_PATH);
if (!runtimeHealth.ffmpeg.available || !runtimeHealth.ffprobe.available) {
  console.warn(
    "[MediaConvertor][server] FFmpeg runtime not fully available. Install ffmpeg/ffprobe or set FFMPEG_PATH and FFPROBE_PATH.",
  );
}

void initConversionService();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health/runtime", (c) => {
  return c.json(getRuntimeHealth(env.FFMPEG_PATH, env.FFPROBE_PATH));
});

app.post("/upload/chunk", async (c) => {
  try {
    const body = await c.req.parseBody();

    const uploadId = String(body.uploadId ?? "").trim();
    const index = Number.parseInt(String(body.index ?? "-1"), 10);
    const totalChunks = Number.parseInt(String(body.totalChunks ?? "0"), 10);
    const filename = String(body.filename ?? "").trim();
    const mimeType = String(body.mimeType ?? "application/octet-stream").trim();
    const chunk = body.chunk;

    if (!(chunk instanceof File)) {
      throw new Error("Chunk is required.");
    }

    await saveChunk({
      uploadId,
      index,
      totalChunks,
      fileName: filename,
      mimeType,
      chunk,
    });

    return c.json({ ok: true }, 201);
  } catch (error) {
    const normalized = normalizeError(error);
    return errorResponse(normalized.message, normalized.status);
  }
});

app.post("/upload/complete", async (c) => {
  try {
    const payload = completeUploadSchema.parse(await c.req.json());

    const result = await completeUpload({
      uploadId: payload.uploadId,
      outputFormat: payload.outputFormat as OutputFormat,
      quality: payload.quality as QualityLevel,
    });

    return c.json(result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid upload completion payload." }, 400);
    }
    const normalized = normalizeError(error);
    return errorResponse(normalized.message, normalized.status);
  }
});

app.get("/progress/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const poll = c.req.query("poll") === "1";

    if (poll) {
      return c.json(readProgress(jobId));
    }

    return streamSSE(c, async (stream) => {
      while (true) {
        const current = readProgress(jobId);

        await stream.writeSSE({
          data: JSON.stringify(current),
          event: "progress",
          id: String(Date.now()),
        });

        if (current.status === "completed" || current.status === "error") {
          break;
        }

        await stream.sleep(450);
      }
    });
  } catch (error) {
    const normalized = normalizeError(error);
    return errorResponse(normalized.message, normalized.status);
  }
});

app.get("/download/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const { contentLength, contentType, fileName, sizeBytes, stream } = await createDownloadStream(jobId);

    return new Response(stream, {
      headers: {
        "content-type": contentType,
        "content-length": String(contentLength),
        "content-disposition": `attachment; filename=\"${fileName}\"`,
        "x-file-size": String(sizeBytes),
      },
      status: 200,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    return errorResponse(normalized.message, normalized.status);
  }
});

app.get("/formats/:kind", (c) => {
  const kind = c.req.param("kind");
  if (kind !== "audio" && kind !== "video" && kind !== "image") {
    return c.json({ error: "Invalid media kind." }, 400);
  }

  return c.json({ formats: getAllowedOutputs(kind) });
});

export default app;
