import {
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

  if (loweredMime.startsWith("video/") || INPUT_EXTENSIONS.video.includes(extension)) {
    return "video";
  }

  if (loweredMime.startsWith("audio/") || INPUT_EXTENSIONS.audio.includes(extension)) {
    return "audio";
  }

  throw new Error("Unsupported file type.");
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

export function getPresetById(id: string) {
  return PROFILE_PRESETS.find((preset) => preset.id === id);
}
