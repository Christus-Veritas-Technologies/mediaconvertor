import type { OutputFormat, QualityLevel } from "@MediaConvertor/conversion";

export type UploadSession = {
  uploadId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  receivedChunks: Set<number>;
  chunkSizes: Map<number, number>;
  receivedBytes: number;
  createdAt: number;
};

export type JobStatus = "queued" | "processing" | "completed" | "error";

export type ConversionJob = {
  id: string;
  status: JobStatus;
  uploadId: string;
  inputName: string;
  inputPath: string;
  outputPath: string;
  outputFormat: OutputFormat;
  quality: QualityLevel;
  createdAt: string;
  completedAt?: string;
  error?: string;
};

export type ProgressRecord = {
  jobId: string;
  percent: number;
  status: JobStatus;
  error?: string;
};
