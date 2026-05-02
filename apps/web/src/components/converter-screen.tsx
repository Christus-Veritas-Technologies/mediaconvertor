"use client";

import {
  PROFILE_PRESETS,
  appendRecent,
  detectMediaKind,
  getAllowedOutputs,
  getPresetById,
  startConversion,
  type ConversionFile,
  type ConversionRecentItem,
  type ConversionState,
  type OutputFormat,
  type QualityLevel,
} from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/web";
import { Button } from "@MediaConvertor/ui/components/button";
import { Card } from "@MediaConvertor/ui/components/card";
import { Input } from "@MediaConvertor/ui/components/input";
import { Label } from "@MediaConvertor/ui/components/label";
import { useEffect, useMemo, useState } from "react";

const RECENT_KEY = "mc_recent_items";

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
  const [recentItems, setRecentItems] = useState<ConversionRecentItem[]>([]);

  const activePreset = useMemo(() => {
    if (!presetId) {
      return null;
    }
    return getPresetById(presetId) ?? null;
  }, [presetId]);

  useEffect(() => {
    setRecentItems(readRecentFromStorage());
  }, []);

  useEffect(() => {
    if (!activePreset) {
      return;
    }

    setOutputFormat(activePreset.outputFormat);
    setQuality(activePreset.quality);
  }, [activePreset]);

  const allowedFormats = useMemo(() => {
    if (!mediaKind) {
      return [] as readonly OutputFormat[];
    }
    return getAllowedOutputs(mediaKind);
  }, [mediaKind]);

  const canConvert =
    state === "idle" &&
    selectedFile !== null &&
    outputFormat !== null &&
    allowedFormats.includes(outputFormat);

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

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
        if (current && nextFormats.includes(current)) {
          return current;
        }

        if (activePreset && nextFormats.includes(activePreset.outputFormat)) {
          return activePreset.outputFormat;
        }

        return nextFormats[0] ?? null;
      });
      setErrorMessage(null);
    } catch (error) {
      setSelectedFile(null);
      setMediaKind(null);
      setOutputFormat(null);
      setErrorMessage(error instanceof Error ? error.message : "Unsupported file.");
    }
  }

  async function handleConvert() {
    if (!selectedFile || !outputFormat) {
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

        setRecentItems((current) => {
          const next = appendRecent(current, item);
          writeRecentToStorage(next);
          return next;
        });
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">MediaConvertor</h1>
        <p className="text-sm text-muted-foreground">Single-screen conversion workflow</p>
      </header>

      <Card className="rounded-2xl bg-card p-4">
        <div className="space-y-4">
          {state === "idle" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="file-input">Select File</Label>
                <Input id="file-input" type="file" onChange={handleFileSelection} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="format-select">Output Format</Label>
                  <select
                    id="format-select"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    value={outputFormat ?? ""}
                    disabled={!selectedFile}
                    onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                  >
                    {allowedFormats.map((format) => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality-select">Quality</Label>
                  <select
                    id="quality-select"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    value={quality}
                    onChange={(event) => setQuality(event.target.value as QualityLevel)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <Button className="h-10 w-full rounded-2xl" disabled={!canConvert} onClick={handleConvert}>
                Convert
              </Button>
            </>
          )}

          {state === "uploading" && (
            <div className="space-y-4 py-4">
              <p className="text-base">Uploading...</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{uploadPercent}%</p>
            </div>
          )}

          {state === "processing" && (
            <div className="space-y-4 py-4">
              <p className="text-base">Converting...</p>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all"
                  style={{ width: `${conversionPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{conversionPercent}%</p>
            </div>
          )}

          {state === "completed" && (
            <div className="space-y-4">
              <p className="text-base font-medium">Conversion completed</p>
              {jobId && (
                <a
                  href={`${env.NEXT_PUBLIC_SERVER_URL}/download/${jobId}`}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Download File
                </a>
              )}
            </div>
          )}

          {state === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-red-500">{errorMessage ?? "Conversion failed."}</p>
              <Button variant="outline" className="h-10 rounded-2xl" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}

          {errorMessage && state !== "error" ? (
            <p className="text-sm text-red-500">{errorMessage}</p>
          ) : null}
        </div>
      </Card>

      <Card className="rounded-2xl bg-card p-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent</h2>
          {recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversions yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-border p-2 text-sm">
                  <p className="font-medium">{item.inputName}</p>
                  <p className="text-muted-foreground">
                    {item.outputFormat.toUpperCase()} · {item.quality}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="rounded-2xl bg-card p-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Presets</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {PROFILE_PRESETS.map((preset) => (
              <a
                key={preset.id}
                href={`/convert/${preset.id}`}
                className="rounded-xl border border-border p-2 text-sm"
              >
                <p className="font-medium">{preset.label}</p>
                <p className="text-muted-foreground">{preset.description}</p>
              </a>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
