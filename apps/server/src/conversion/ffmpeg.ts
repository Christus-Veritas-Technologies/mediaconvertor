import { spawn, spawnSync } from "node:child_process";

import type { ConversionJob } from "./types";

type ProgressCallback = (percent: number) => void;

type FfmpegConfig = {
  ffmpegPath: string;
  ffprobePath: string;
};

function getVideoQualityArgs(quality: ConversionJob["quality"]): string[] {
  if (quality === "high") {
    return ["-c:v", "libx264", "-crf", "20", "-preset", "slow", "-c:a", "aac", "-b:a", "192k"];
  }
  if (quality === "low") {
    return ["-c:v", "libx264", "-crf", "32", "-preset", "veryfast", "-c:a", "aac", "-b:a", "96k"];
  }
  return ["-c:v", "libx264", "-crf", "26", "-preset", "medium", "-c:a", "aac", "-b:a", "128k"];
}

function getAudioQualityArgs(quality: ConversionJob["quality"], outputFormat: ConversionJob["outputFormat"]) {
  const codecByFormat: Record<string, string> = {
    mp3: "libmp3lame",
    aac: "aac",
    m4a: "aac",
    ogg: "libvorbis",
    wav: "pcm_s16le",
  };

  const bitrate = quality === "high" ? "256k" : quality === "low" ? "96k" : "160k";
  const codec = codecByFormat[outputFormat] ?? "aac";

  if (outputFormat === "wav") {
    return ["-c:a", codec];
  }

  return ["-c:a", codec, "-b:a", bitrate];
}

function readDurationSeconds(ffprobePath: string, inputPath: string): number {
  const probe = spawnSync(
    ffprobePath,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      inputPath,
    ],
    {
      encoding: "utf8",
    },
  );

  if (probe.status !== 0) {
    return 0;
  }

  const parsed = Number.parseFloat(probe.stdout.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOutTimeMs(line: string): number | null {
  if (!line.startsWith("out_time_ms=")) {
    return null;
  }
  const value = Number.parseInt(line.replace("out_time_ms=", "").trim(), 10);
  return Number.isFinite(value) ? value : null;
}

function ffmpegArgs(job: ConversionJob): string[] {
  const outputExt = job.outputFormat;
  const isVideo = ["mp4", "mov", "webm"].includes(outputExt);

  if (isVideo) {
    return [
      "-y",
      "-i",
      job.inputPath,
      ...getVideoQualityArgs(job.quality),
      "-progress",
      "pipe:1",
      "-nostats",
      job.outputPath,
    ];
  }

  return [
    "-y",
    "-i",
    job.inputPath,
    ...getAudioQualityArgs(job.quality, job.outputFormat),
    "-progress",
    "pipe:1",
    "-nostats",
    job.outputPath,
  ];
}

export async function runConversion(
  job: ConversionJob,
  config: FfmpegConfig,
  onProgress: ProgressCallback,
): Promise<void> {
  const durationSeconds = readDurationSeconds(config.ffprobePath, job.inputPath);
  const totalDurationMs = durationSeconds > 0 ? durationSeconds * 1000 : 0;

  const process = spawn(config.ffmpegPath, ffmpegArgs(job));

  process.stdout.setEncoding("utf8");
  process.stdout.on("data", (chunk: string) => {
    const lines = chunk.split(/\r?\n/);
    for (const line of lines) {
      const outTimeMs = parseOutTimeMs(line);
      if (outTimeMs === null || totalDurationMs <= 0) {
        continue;
      }

      const percent = (outTimeMs / totalDurationMs) / 1000 * 100;
      onProgress(Math.min(99, percent));
    }
  });

  process.stderr.setEncoding("utf8");

  await new Promise<void>((resolve, reject) => {
    process.on("error", reject);
    process.on("close", (code) => {
      if (code === 0) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code ?? -1}`));
    });
  });
}
