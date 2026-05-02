import { AppError } from "./errors";
import type { ConversionJob, ProgressRecord, UploadSession } from "./types";

const uploadSessions = new Map<string, UploadSession>();
const jobs = new Map<string, ConversionJob>();
const progress = new Map<string, ProgressRecord>();
const queue: string[] = [];

export function createOrGetUploadSession(session: UploadSession) {
  const existing = uploadSessions.get(session.uploadId);
  if (existing) {
    return existing;
  }
  uploadSessions.set(session.uploadId, session);
  return session;
}

export function getUploadSession(uploadId: string): UploadSession {
  const session = uploadSessions.get(uploadId);
  if (!session) {
    throw new AppError("Upload session not found", 404, "upload_not_found");
  }
  return session;
}

export function updateUploadChunk(uploadId: string, index: number, chunkBytes: number) {
  const session = getUploadSession(uploadId);

  const previousSize = session.chunkSizes.get(index) ?? 0;
  session.chunkSizes.set(index, chunkBytes);
  session.receivedBytes = session.receivedBytes - previousSize + chunkBytes;
  session.receivedChunks.add(index);

  return session.receivedBytes;
}

export function deleteUploadSession(uploadId: string) {
  uploadSessions.delete(uploadId);
}

export function hasAllChunks(uploadId: string): boolean {
  const session = getUploadSession(uploadId);
  return session.receivedChunks.size === session.totalChunks;
}

export function createJob(job: ConversionJob) {
  jobs.set(job.id, job);
  progress.set(job.id, {
    jobId: job.id,
    percent: 0,
    status: "queued",
  });
  queue.push(job.id);
}

export function dequeueJob(): ConversionJob | null {
  const jobId = queue.shift();
  if (!jobId) {
    return null;
  }
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }
  return job;
}

export function updateJobStatus(jobId: string, status: ConversionJob["status"], error?: string) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }
  job.status = status;
  if (status === "completed") {
    job.completedAt = new Date().toISOString();
  }
  if (error) {
    job.error = error;
  }
}

export function updateProgress(jobId: string, percent: number, status?: ProgressRecord["status"]) {
  const current = progress.get(jobId);
  if (!current) {
    return;
  }
  current.percent = Math.max(0, Math.min(100, Math.round(percent)));
  if (status) {
    current.status = status;
  }
}

export function setProgressError(jobId: string, error: string) {
  const current = progress.get(jobId);
  if (!current) {
    return;
  }
  current.status = "error";
  current.error = error;
}

export function getProgress(jobId: string): ProgressRecord {
  const current = progress.get(jobId);
  if (!current) {
    throw new AppError("Job not found", 404, "job_not_found");
  }
  return current;
}

export function getJob(jobId: string): ConversionJob {
  const job = jobs.get(jobId);
  if (!job) {
    throw new AppError("Job not found", 404, "job_not_found");
  }
  return job;
}

export function queueSize() {
  return queue.length;
}
