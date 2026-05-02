"use client";

import {
  appendRecent,
  detectMediaKind,
  getFileExtension,
  getFormatCardOptions,
  getPresetById,
  getSupportedOutputsForInputExtension,
  startConversion,
  validateConversionPair,
  type ConversionFile,
  type ConversionState,
  type OutputFormat,
  type RecentItem,
} from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/web";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@MediaConvertor/ui/components/button";
import { Card } from "@MediaConvertor/ui/components/card";
import { useEffect, useMemo, useRef, useState } from "react";

const RECENT_KEY = "recent_conversions";
const ACCEPTED_FILE_TYPES = ".mp3,.mp4,.jpeg,.jpg,.png,.webp";

const DEFAULT_FORMAT_BY_INPUT: Record<string, OutputFormat> = {
  mp4: "mp3",
  mp3: "mp3",
  wav: "mp3",
  webp: "png",
  png: "webp",
  jpg: "png",
  jpeg: "png",
};

type DefaultConverterConfig = {
  inputFormat?: string;
  outputFormat: OutputFormat;
  lockedOutput?: boolean;
};

type ConverterScreenProps = {
  presetId?: string;
  defaultConfig?: DefaultConverterConfig;
};

function readRecentFromStorage(): RecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RecentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentToStorage(items: RecentItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(items));
}

function formatFileSize(size: number): string {
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

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

export default function ConverterScreen({ presetId, defaultConfig }: ConverterScreenProps) {
  const [state, setState] = useState<ConversionState>("idle");
  const [selectedFile, setSelectedFile] = useState<ConversionFile | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
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

  const formatCards = useMemo(() => getFormatCardOptions(), []);

  const supportedOutputs = useMemo(() => {
    if (!selectedFile) {
      return [] as readonly OutputFormat[];
    }
    const extension = getFileExtension(selectedFile.name);
    return getSupportedOutputsForInputExtension(extension);
  }, [selectedFile]);

  const isFormatLocked = !!defaultConfig?.lockedOutput;
  const isLocked = state === "uploading" || state === "processing";

  useEffect(() => {
    if (state === "processing") {
      cardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [state]);

  useEffect(() => {
    if (!activePreset) {
      return;
    }
    setOutputFormat(activePreset.outputFormat);
  }, [activePreset]);

  useEffect(() => {
    if (defaultConfig?.outputFormat) {
      setOutputFormat(defaultConfig.outputFormat);
    }
  }, [defaultConfig?.outputFormat]);

  async function applySelectedFile(file: File) {
    if (isLocked) {
      return;
    }

    try {
      const nextFile: ConversionFile = {
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        blob: file,
      };

      detectMediaKind(nextFile.name, nextFile.mimeType);
      const nextSupported = getSupportedOutputsForInputExtension(getFileExtension(nextFile.name));

      setSelectedFile(nextFile);
      setOutputFormat((current) => {
        if (current && nextSupported.includes(current)) {
          return current;
        }

        if (activePreset && nextSupported.includes(activePreset.outputFormat)) {
          return activePreset.outputFormat;
        }

        return smartSelectFormat(nextFile.name, nextSupported);
      });
      setErrorMessage(null);
      setState("idle");
      setUploadPercent(0);
      setConversionPercent(0);
      setJobId(null);
    } catch (error) {
      setSelectedFile(null);
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

  function handleFormatSelect(nextFormat: OutputFormat) {
    setOutputFormat(nextFormat);

    if (!selectedFile) {
      setErrorMessage(null);
      return;
    }

    try {
      validateConversionPair(selectedFile.name, nextFormat);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid conversion pair.");
    }
  }

  async function handleConvert() {
    if (!selectedFile || !outputFormat || isLocked) {
      return;
    }

    try {
      validateConversionPair(selectedFile.name, outputFormat);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid conversion pair.");
      return;
    }

    setErrorMessage(null);

    try {
      const result = await startConversion(
        {
          file: selectedFile,
          selection: {
            outputFormat,
            quality: "medium",
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

        const item: RecentItem = {
          id: result.success.jobId,
          fileName: selectedFile.name,
          inputFormat: getFileExtension(selectedFile.name).toUpperCase(),
          outputFormat: outputFormat.toUpperCase(),
          createdAt: Date.now(),
          uri: `${env.NEXT_PUBLIC_SERVER_URL}/download/${result.success.jobId}`,
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

  const canConvert = state === "idle" && !!selectedFile && !!outputFormat && !isLocked;

  const lockedOutputLabel = defaultConfig?.outputFormat?.toUpperCase() ?? "";
  const ctaText =
    state === "uploading"
      ? "Uploading..."
      : state === "processing"
        ? "Converting..."
        : isFormatLocked
          ? `Convert to ${lockedOutputLabel}`
          : "Convert Now";

  return (
    <main className="mx-auto flex h-full w-full max-w-5xl flex-col justify-start px-4 py-8">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Convert your video or audio</h1>
          <p className="text-sm text-muted-foreground">Upload, convert, and download in one flow.</p>
        </header>

        <motion.div layout transition={{ duration: 0.22 }}>
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
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              aria-label="Upload media file"
              onChange={(event) => {
                void handleFileSelection(event);
              }}
            />

            <AnimatePresence mode="wait">
              {state === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid min-h-48 place-items-center gap-4 text-center"
                >
                  <div className="h-10 w-10 rounded-2xl bg-primary/10" />
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
                </motion.div>
              )}

              {state === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid min-h-48 place-items-center gap-4 text-center"
                >
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground">Uploading...</p>
                    <p className="text-sm text-muted-foreground">Uploading chunks {uploadPercent}%</p>
                  </div>
                </motion.div>
              )}

              {state === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid min-h-48 gap-5 py-6"
                >
                  <p className="text-center text-base font-medium text-foreground">Converting...</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${conversionPercent}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">{conversionPercent}%</p>
                </motion.div>
              )}

              {state === "completed" && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid min-h-48 place-items-center gap-4 text-center"
                >
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
                </motion.div>
              )}

              {state === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid min-h-48 place-items-center gap-4 text-center"
                >
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-destructive">Something went wrong</p>
                    <p className="text-sm text-muted-foreground">{errorMessage ?? "Please try again."}</p>
                  </div>
                  <Button variant="outline" className="h-11 rounded-2xl px-6" onClick={handleRetry}>
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {isFormatLocked ? (
          <section className="grid gap-3">
            <p className="text-sm font-medium text-foreground">
              {defaultConfig?.inputFormat
                ? `Convert ${defaultConfig.inputFormat.toUpperCase()} to ${lockedOutputLabel}`
                : `Convert to ${lockedOutputLabel}`}
            </p>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
              <span className="block text-xs uppercase tracking-wide text-muted-foreground">Output format</span>
              <span className="block text-base font-semibold text-foreground">{lockedOutputLabel}</span>
            </div>
          </section>
        ) : (
          <section className="grid gap-3">
            <p className="text-sm font-medium text-foreground">Convert to</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {formatCards.map((format) => {
                const isSupported = !selectedFile || supportedOutputs.includes(format);
                const isSelected = outputFormat === format;

                return (
                  <button
                    key={format}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleFormatSelect(format)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isSupported
                          ? "border-border bg-card text-foreground hover:border-primary/40"
                          : "border-border bg-muted text-muted-foreground"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block text-xs uppercase tracking-wide">Convert to</span>
                    <span className="block text-base font-semibold">{format.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

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
