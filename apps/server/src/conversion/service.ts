import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  type OutputFormat,
  type QualityLevel,
  getFileExtension,
  validateConversionPair,
} from "@MediaConvertor/conversion";

import { env } from "@MediaConvertor/env/server";
import { AppError } from "./errors";
import { runConversion } from "./ffmpeg";
import {
  cleanupJob,
  cleanupUpload,
  createJobId,
  ensureTmpDirectories,
  inputFilePath,
  outputFilePath,
  sanitizeFilename,
  uploadChunksDir,
} from "./paths";
import {
  createJob,
  createOrGetUploadSession,
  deleteUploadSession,
  dequeueJob,
  getJob,
  getProgress,
  getUploadSession,
  hasAllChunks,
  setProgressError,
  updateJobStatus,
  updateProgress,
  updateUploadChunk,
} from "./store";
import type { ConversionJob } from "./types";

const WORKER_COUNT = env.MAX_CONCURRENT_JOBS;
const ffmpegPath = env.FFMPEG_PATH;
const ffprobePath = env.FFPROBE_PATH;

let workersStarted = false;

function chunkPath(uploadId: string, index: number) {
  return path.join(uploadChunksDir(uploadId), `${String(index).padStart(8, "0")}.chunk`);
}

export async function initConversionService() {
  await ensureTmpDirectories();
  if (workersStarted) {
    return;
  }
  workersStarted = true;
  for (let index = 0; index < WORKER_COUNT; index += 1) {
    void runWorker();
  }
}

export async function saveChunk(params: {
  uploadId: string;
  index: number;
  totalChunks: number;
  fileName: string;
  mimeType: string;
  chunk: File;
}) {
  const { chunk, fileName, index, mimeType, totalChunks, uploadId } = params;

  if (index < 0 || totalChunks <= 0 || index >= totalChunks) {
    throw new AppError("Invalid chunk metadata", 400, "invalid_chunk_meta");
  }

  const safeName = sanitizeFilename(fileName);
  const session = createOrGetUploadSession({
    uploadId,
    fileName: safeName,
    mimeType,
    totalChunks,
    receivedChunks: new Set<number>(),
    createdAt: Date.now(),
  });

  if (session.totalChunks !== totalChunks || session.fileName !== safeName) {
    throw new AppError("Upload session metadata mismatch", 400, "upload_mismatch");
  }

  const targetDir = uploadChunksDir(uploadId);
  await mkdir(targetDir, { recursive: true });

  const bytes = new Uint8Array(await chunk.arrayBuffer());
  await Bun.write(chunkPath(uploadId, index), bytes);
  updateUploadChunk(uploadId, index);
}

async function mergeChunks(uploadId: string, destinationPath: string) {
  const session = getUploadSession(uploadId);

  if (!hasAllChunks(uploadId)) {
    throw new AppError("Upload is incomplete", 400, "upload_incomplete");
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });

  const writeStream = createWriteStream(destinationPath, { flags: "w" });
  for (let index = 0; index < session.totalChunks; index += 1) {
    await pipeline(createReadStream(chunkPath(uploadId, index)), writeStream, { end: false });
  }
  writeStream.end();
}

export async function completeUpload(params: {
  uploadId: string;
  outputFormat: OutputFormat;
  quality: QualityLevel;
}) {
  const { outputFormat, quality, uploadId } = params;
  const session = getUploadSession(uploadId);

  const extension = getFileExtension(session.fileName);
  if (!extension) {
    throw new AppError("Missing file extension", 400, "missing_extension");
  }

  validateConversionPair(session.fileName, outputFormat);

  const jobId = createJobId();
  const inputPath = inputFilePath(jobId, extension);
  const outputPath = outputFilePath(jobId, outputFormat);

  await mergeChunks(uploadId, inputPath);

  const job: ConversionJob = {
    id: jobId,
    status: "queued",
    uploadId,
    inputName: session.fileName,
    inputPath,
    outputPath,
    outputFormat,
    quality,
    createdAt: new Date().toISOString(),
  };

  createJob(job);
  deleteUploadSession(uploadId);
  await cleanupUpload(uploadId);

  return {
    jobId,
  };
}

async function runWorker() {
  while (true) {
    const next = dequeueJob();
    if (!next) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      continue;
    }

    try {
      updateJobStatus(next.id, "processing");
      updateProgress(next.id, 1, "processing");

      await runConversion(
        next,
        {
          ffmpegPath,
          ffprobePath,
        },
        (percent) => {
          updateProgress(next.id, percent, "processing");
        },
      );

      const outputStats = await stat(next.outputPath);
      if (!outputStats.isFile()) {
        throw new AppError("Output file missing", 500, "missing_output");
      }

      updateJobStatus(next.id, "completed");
      updateProgress(next.id, 100, "completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Conversion failed";
      updateJobStatus(next.id, "error", message);
      setProgressError(next.id, message);
    }
  }
}

export function readProgress(jobId: string) {
  return getProgress(jobId);
}

export function readJob(jobId: string) {
  return getJob(jobId);
}

export async function createDownloadStream(jobId: string) {
  const job = getJob(jobId);
  if (job.status !== "completed") {
    throw new AppError("Job is not completed", 400, "job_not_completed");
  }

  const stats = await stat(job.outputPath);
  const stream = createReadStream(job.outputPath);

  stream.on("close", () => {
    void cleanupJob(jobId);
  });

  return {
    stream: Readable.toWeb(stream) as ReadableStream,
    fileName: `converted-${job.id}.${job.outputFormat}`,
    contentLength: stats.size,
    contentType: inferContentType(job.outputFormat),
    sizeBytes: stats.size,
  };
}

function inferContentType(format: OutputFormat) {
  const map: Record<OutputFormat, string> = {
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return map[format];
}
