import { spawnSync } from "node:child_process";

export type BinaryHealth = {
  available: boolean;
  version: string;
};

export type RuntimeHealth = {
  ffmpeg: BinaryHealth;
  ffprobe: BinaryHealth;
};

function readBinaryVersion(binaryPath: string): BinaryHealth {
  const result = spawnSync(binaryPath, ["-version"], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return {
      available: false,
      version: "unavailable",
    };
  }

  const firstLine = result.stdout.split(/\r?\n/)[0]?.trim() ?? "available";
  return {
    available: true,
    version: firstLine,
  };
}

export function getRuntimeHealth(ffmpegPath: string, ffprobePath: string): RuntimeHealth {
  return {
    ffmpeg: readBinaryVersion(ffmpegPath),
    ffprobe: readBinaryVersion(ffprobePath),
  };
}
