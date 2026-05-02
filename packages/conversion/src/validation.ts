import {
  CONVERSION_RULES,
  FORMAT_CARD_OPTIONS,
  INPUT_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  OUTPUT_BY_KIND,
  PROFILE_PRESETS,
} from "./config";
import type {
  ConversionFile,
  MediaKind,
  OutputFormat,
  SelectedConversion,
} from "./types";

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

export function detectMediaKind(fileName: string, mimeType: string): MediaKind {
  const extension = getFileExtension(fileName);
  const loweredMime = mimeType.toLowerCase();

  if (!isAcceptedInputExtension(extension)) {
    throw new Error("Unsupported file type. Accepted: mp3, mp4, jpeg, webp, jpg, png.");
  }

  if (INPUT_EXTENSIONS.video.includes(extension) || loweredMime === "video/mp4") {
    return "video";
  }

  if (INPUT_EXTENSIONS.audio.includes(extension) || loweredMime === "audio/mpeg") {
    return "audio";
  }

  if (INPUT_EXTENSIONS.image.includes(extension) || loweredMime.startsWith("image/")) {
    return "image";
  }

  throw new Error("Unsupported file type.");
}

export function isAcceptedInputExtension(extension: string): boolean {
  return [
    ...INPUT_EXTENSIONS.audio,
    ...INPUT_EXTENSIONS.video,
    ...INPUT_EXTENSIONS.image,
  ].includes(extension);
}

export function validateInputFile(file: ConversionFile): MediaKind {
  if (!file.name) {
    throw new Error("File must have a name.");
  }

  if (file.size <= 0) {
    throw new Error("File is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds maximum allowed size.");
  }

  return detectMediaKind(file.name, file.mimeType);
}

export function getAllowedOutputs(kind: MediaKind): readonly OutputFormat[] {
  return OUTPUT_BY_KIND[kind];
}

export function validateSelection(kind: MediaKind, selection: SelectedConversion): void {
  if (!OUTPUT_BY_KIND[kind].includes(selection.outputFormat)) {
    throw new Error("Selected output format is invalid for this file type.");
  }
}

export function getFormatCardOptions(): readonly OutputFormat[] {
  return FORMAT_CARD_OPTIONS;
}

export function getSupportedOutputsForInputExtension(extension: string): readonly OutputFormat[] {
  const lowered = extension.toLowerCase();
  return CONVERSION_RULES[lowered] ?? [];
}

export function validateConversionPair(inputFileName: string, outputFormat: OutputFormat): void {
  const extension = getFileExtension(inputFileName);
  const supported = getSupportedOutputsForInputExtension(extension);

  if (!supported.includes(outputFormat)) {
    throw new Error(`Cannot convert .${extension || "unknown"} to ${outputFormat.toUpperCase()}.`);
  }
}

export function getPresetById(id: string) {
  return PROFILE_PRESETS.find((preset) => preset.id === id);
}
