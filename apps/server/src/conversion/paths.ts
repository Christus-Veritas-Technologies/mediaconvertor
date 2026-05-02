import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

export const TMP_ROOT = path.join(process.cwd(), "tmp");

export function sanitizeFilename(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+/, "")
    .slice(0, 120);
}

export function ensureSafeExtension(extension: string): string {
  return extension.replace(/[^a-zA-Z0-9]/g, "");
}

export async function ensureTmpDirectories() {
  await mkdir(TMP_ROOT, { recursive: true });
}

export function uploadDir(uploadId: string) {
  return path.join(TMP_ROOT, "uploads", uploadId);
}

export function uploadChunksDir(uploadId: string) {
  return path.join(uploadDir(uploadId), "chunks");
}

export function createJobId() {
  return `job_${randomUUID()}`;
}

export function jobDir(jobId: string) {
  return path.join(TMP_ROOT, "jobs", jobId);
}

export function inputFilePath(jobId: string, extension: string) {
  return path.join(jobDir(jobId), `input.${ensureSafeExtension(extension)}`);
}

export function outputFilePath(jobId: string, extension: string) {
  return path.join(jobDir(jobId), `output.${ensureSafeExtension(extension)}`);
}

export async function cleanupUpload(uploadId: string) {
  await rm(uploadDir(uploadId), { recursive: true, force: true });
}

export async function cleanupJob(jobId: string) {
  await rm(jobDir(jobId), { recursive: true, force: true });
}
