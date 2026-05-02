"use client";

import {
  appendRecent,
  detectMediaKind,
  getAllowedOutputs,
  getFileExtension,
  getPresetById,
  startConversion,
  type ConversionFile,
  type ConversionRecentItem,
  type ConversionState,
  type OutputFormat,
  type QualityLevel,
} from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/web";
import { UploadCloud } from "lucide-react";
import { Button } from "@MediaConvertor/ui/components/button";
import { Card } from "@MediaConvertor/ui/components/card";
import { useEffect, useMemo, useRef, useState } from "react";

const RECENT_KEY = "mc_recent_items";
const MAX_VISIBLE_FORMATS = 8;

const DEFAULT_FORMAT_BY_INPUT: Record<string, OutputFormat> = {
  mp4: "mp3",
  mkv: "mp4",
  wav: "mp3",
};

type ConverterScreenProps = {
  presetId?: string;
};

function readRecentFromStorage(): ConversionRecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ConversionRecentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentToStorage(items: ConversionRecentItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(items));
}

export default function ConverterScreen({ presetId }: ConverterScreenProps) {
  const [state, setState] = useState<ConversionState>("idle");
  const [selectedFile, setSelectedFile] = useState<ConversionFile | null>(null);
  const [mediaKind, setMediaKind] = useState<"audio" | "video" | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [quality, setQuality] = useState<QualityLevel>("medium");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [conversionPercent, setConversionPercent] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset = useMemo(() => {
    if (!presetId) {
      return null;
    }
    return getPresetById(presetId) ?? null;
  }, [presetId]);

  useEffect(() => {
    if (!activePreset) {
      return;
    }

    setOutputFormat(activePreset.outputFormat);
    setQuality(activePreset.quality);
  }, [activePreset]);

  const allowedFormats = useMemo<readonly OutputFormat[]>(() => {
    if (!mediaKind) {
      return [];
    }
    return getAllowedOutputs(mediaKind).slice(0, MAX_VISIBLE_FORMATS);
  }, [mediaKind]);

  useEffect(() => {
    if (state === "processing") {
      cardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [state]);

  const canConvert =
    state === "idle" &&
    selectedFile !== null &&
    outputFormat !== null &&
    allowedFormats.includes(outputFormat);

  const isLocked = state === "uploading" || state === "processing";

  function smartSelectFormat(fileName: string, options: readonly OutputFormat[]): OutputFormat | null {
    if (options.length === 0) {
      return null;
    }

    const extension = getFileExtension(fileName);
    const mapped = DEFAULT_FORMAT_BY_INPUT[extension];

    if (mapped && options.includes(mapped)) {
      return mapped;
    }

    return options[0] ?? null;
  }

  async function applySelectedFile(file: File) {
    if (isLocked) {
      return;
    }

    if (!file) {
      return;
    }

    try {
      const nextFile: ConversionFile = {
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        blob: file,
      };

      const detectedKind = detectMediaKind(nextFile.name, nextFile.mimeType);
      const nextFormats = getAllowedOutputs(detectedKind);

      setSelectedFile(nextFile);
      setMediaKind(detectedKind);
      setOutputFormat((current) => {
        const visibleFormats = nextFormats.slice(0, MAX_VISIBLE_FORMATS);

        if (current && visibleFormats.includes(current)) {
          return current;
        }

        if (activePreset && visibleFormats.includes(activePreset.outputFormat)) {
          return activePreset.outputFormat;
        }

        return smartSelectFormat(nextFile.name, visibleFormats);
      });
      setErrorMessage(null);
      setState("idle");
      setUploadPercent(0);
      setConversionPercent(0);
      setJobId(null);
    } catch (error) {
      setSelectedFile(null);
      setMediaKind(null);
      setOutputFormat(null);
      setErrorMessage(error instanceof Error ? error.message : "Unsupported file.");
    }
  }

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await applySelectedFile(file);
  }

  function openFileDialog() {
    if (isLocked) {
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleConvert() {
    if (!selectedFile || !outputFormat || isLocked) {
      return;
    }

    setErrorMessage(null);

    try {
      const result = await startConversion(
        {
          file: selectedFile,
          selection: {
            outputFormat,
            quality,
          },
        },
        {
          serverUrl: env.NEXT_PUBLIC_SERVER_URL,
          onStateChange: (next) => {
            setState(next.state);
            setUploadPercent(next.progress.uploadPercent);
            setConversionPercent(next.progress.conversionPercent);
            if (next.error) {
              setErrorMessage(next.error);
            }
          },
        },
      );

      setState(result.state);

      if (result.state === "completed" && result.success) {
        setJobId(result.success.jobId);

        const item: ConversionRecentItem = {
          id: result.success.jobId,
          inputName: selectedFile.name,
          outputName: `converted-${result.success.jobId}.${outputFormat}`,
          outputFormat,
          quality,
          sizeBytes: result.success.sizeBytes,
          createdAt: new Date().toISOString(),
        };

        const next = appendRecent(readRecentFromStorage(), item);
        writeRecentToStorage(next);
      }

      if (result.state === "error") {
        setErrorMessage(result.error ?? "Conversion failed.");
      }
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Conversion failed.");
    }
  }

  function handleRetry() {
    setState("idle");
    setErrorMessage(null);
    setUploadPercent(0);
    setConversionPercent(0);
  }

  function formatFileSize(size: number): string {
    const mb = size / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  const ctaText =
    state === "uploading"
      ? "Uploading..."
      : state === "processing"
        ? "Converting..."
        : "Convert Now";

  return (
    <main className="mx-auto flex h-full w-full max-w-5xl flex-col justify-start px-4 py-8">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Convert your video or audio</h1>
          <p className="text-sm text-muted-foreground">Upload, convert, and download in one flow.</p>
        </header>

        <Card
          ref={cardRef}
          role="button"
          tabIndex={isLocked ? -1 : 0}
          onClick={state === "idle" ? openFileDialog : undefined}
          onKeyDown={(event) => {
            if (state !== "idle") {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFileDialog();
            }
          }}
          onDragOver={(event) => {
            if (isLocked) {
              return;
            }

            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            if (isLocked) {
              return;
            }

            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void applySelectedFile(file);
            }
          }}
          className={`rounded-2xl border p-6 transition ${
            isDragging ? "border-primary bg-secondary" : "border-border bg-card"
          } ${state === "idle" ? "cursor-pointer" : "cursor-default"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-label="Upload media file"
            onChange={(event) => {
              void handleFileSelection(event);
            }}
          />

          {state === "idle" && (
            <div className="grid min-h-48 place-items-center gap-4 text-center">
              <UploadCloud className="h-10 w-10 text-primary" />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">Tap to upload file</p>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                </div>
              )}
            </div>
          )}

          {state === "uploading" && (
            <div className="grid min-h-48 place-items-center gap-4 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">Uploading...</p>
                <p className="text-sm text-muted-foreground">Uploading chunks {uploadPercent}%</p>
              </div>
            </div>
          )}

          {state === "processing" && (
            <div className="grid min-h-48 gap-5 py-6">
              <p className="text-center text-base font-medium text-foreground">Converting...</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${conversionPercent}%` }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">{conversionPercent}%</p>
            </div>
          )}

          {state === "completed" && (
            <div className="grid min-h-48 place-items-center gap-4 text-center">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">Conversion Complete</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? `${selectedFile.name.split(".")[0]}.${outputFormat}` : "Converted file ready"}
                </p>
              </div>
              {jobId && (
                <a
                  href={`${env.NEXT_PUBLIC_SERVER_URL}/download/${jobId}`}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
                >
                  Download
                </a>
              )}
            </div>
          )}

          {state === "error" && (
            <div className="grid min-h-48 place-items-center gap-4 text-center">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-destructive">Something went wrong</p>
                <p className="text-sm text-muted-foreground">{errorMessage ?? "Please try again."}</p>
              </div>
              <Button variant="outline" className="h-11 rounded-2xl px-6" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          )}
        </Card>

        <section className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Convert to</p>
          <div className="flex flex-wrap gap-2">
            {allowedFormats.length === 0 && (
              <span className="text-sm text-muted-foreground">Select a file to view formats</span>
            )}
            {allowedFormats.map((format) => (
              <button
                key={format}
                type="button"
                disabled={!selectedFile || isLocked}
                onClick={() => setOutputFormat(format)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  outputFormat === format
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-muted"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {state !== "completed" && state !== "error" && (
          <Button
            className="h-12 rounded-2xl text-sm font-semibold"
            disabled={!canConvert || isLocked}
            onClick={handleConvert}
          >
            {ctaText}
          </Button>
        )}

        {errorMessage && state !== "error" ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
      </div>
    </main>
  );
}
