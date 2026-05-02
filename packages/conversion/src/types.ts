export type ConversionState = "idle" | "uploading" | "processing" | "completed" | "error";

export type MediaKind = "audio" | "video" | "image";

export type QualityLevel = "low" | "medium" | "high";

export type OutputFormat =
  | "mp4"
  | "mp3"
  | "jpeg"
  | "jpg"
  | "png"
  | "webp";

export type ConversionProfile = {
  id: string;
  label: string;
  description: string;
  outputFormat: OutputFormat;
  quality: QualityLevel;
};

export type SelectedConversion = {
  outputFormat: OutputFormat;
  quality: QualityLevel;
};

export type ConversionFile = {
  name: string;
  size: number;
  mimeType: string;
  blob: Blob;
};

export type ProgressMessage = {
  jobId: string;
  percent: number;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
};

export type ConversionSuccess = {
  jobId: string;
  outputFileName: string;
  outputFormat: OutputFormat;
  sizeBytes: number;
  completedAt: string;
};

export type ConversionRecentItem = {
  id: string;
  inputName: string;
  outputName: string;
  outputFormat: OutputFormat;
  quality: QualityLevel;
  sizeBytes: number;
  createdAt: string;
};

export type ApiErrorPayload = {
  error: string;
  code?: string;
};
