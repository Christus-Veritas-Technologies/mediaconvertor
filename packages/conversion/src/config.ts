import type { ConversionProfile, MediaKind, OutputFormat } from "./types";

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_CHUNK_RETRIES = 3;

export const INPUT_EXTENSIONS: Record<MediaKind, readonly string[]> = {
  video: ["mp4"],
  audio: ["mp3"],
  image: ["jpeg", "jpg", "png", "webp"],
} as const;

export const OUTPUT_BY_KIND: Record<MediaKind, readonly OutputFormat[]> = {
  video: ["mp4", "mp3"],
  audio: ["mp3"],
  image: ["jpeg", "jpg", "png", "webp"],
} as const;

export const FORMAT_CARD_OPTIONS: readonly OutputFormat[] = [
  "mp3",
  "mp4",
  "jpeg",
  "jpg",
  "png",
  "webp",
] as const;

export const CONVERSION_RULES: Record<string, readonly OutputFormat[]> = {
  mp3: ["mp3"],
  mp4: ["mp3", "mp4"],
  jpeg: ["jpeg", "jpg", "png", "webp"],
  jpg: ["jpeg", "jpg", "png", "webp"],
  png: ["jpeg", "jpg", "png", "webp"],
  webp: ["png", "jpg", "jpeg", "webp"],
} as const;

export const PROFILE_PRESETS: readonly ConversionProfile[] = [
  {
    id: "video-to-audio",
    label: "MP4 to MP3",
    description: "Extract audio from MP4",
    outputFormat: "mp3",
    quality: "medium",
  },
  {
    id: "keep-video",
    label: "Keep as MP4",
    description: "Video output in MP4",
    outputFormat: "mp4",
    quality: "high",
  },
  {
    id: "image-web-friendly",
    label: "Image to PNG",
    description: "Lossless image output",
    outputFormat: "png",
    quality: "medium",
  },
  {
    id: "image-compact",
    label: "Image to WEBP",
    description: "Smaller image output",
    outputFormat: "webp",
    quality: "high",
  },
];
