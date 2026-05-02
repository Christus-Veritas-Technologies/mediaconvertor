import {
  detectMediaKind,
  getFileExtension,
  getAllowedOutputs,
  startConversion,
  type ConversionFile,
  type ConversionState,
  type OutputFormat,
} from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { saveRecentItem as saveRecentToDb } from "@/lib/recent-store";

const MAX_VISIBLE_FORMATS = 8;
const DEFAULT_FORMAT_BY_INPUT: Record<string, OutputFormat> = {
  mp4: "mp3",
  mkv: "mp4",
  wav: "mp3",
};

export default function Home() {
  const [state, setState] = useState<ConversionState>("idle");
  const [selectedFile, setSelectedFile] = useState<ConversionFile | null>(null);
  const [mediaKind, setMediaKind] = useState<"audio" | "video" | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [conversionPercent, setConversionPercent] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allowedFormats = useMemo(() => {
    if (!mediaKind) {
      return [] as readonly OutputFormat[];
    }
    return getAllowedOutputs(mediaKind).slice(0, MAX_VISIBLE_FORMATS);
  }, [mediaKind]);

  const isLocked = state === "uploading" || state === "processing";

  const canConvert =
    state === "idle" &&
    !isLocked &&
    selectedFile !== null &&
    outputFormat !== null &&
    allowedFormats.includes(outputFormat);

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

  function formatFileSize(size: number): string {
    const mb = size / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  async function handlePickFile() {
    if (isLocked) {
      return;
    }

    const picked = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["audio/*", "video/*"],
      copyToCacheDirectory: true,
    });

    if (picked.canceled || picked.assets.length === 0) {
      return;
    }

    const asset = picked.assets[0];

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const file: ConversionFile = {
        name: asset.name,
        size: asset.size ?? blob.size,
        mimeType: asset.mimeType ?? "application/octet-stream",
        blob,
      };

      const kind = detectMediaKind(file.name, file.mimeType);
      const nextFormats = getAllowedOutputs(kind);

      setSelectedFile(file);
      setMediaKind(kind);
      setOutputFormat(smartSelectFormat(file.name, nextFormats.slice(0, MAX_VISIBLE_FORMATS)));
      setState("idle");
      setUploadPercent(0);
      setConversionPercent(0);
      setJobId(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to read file.");
    }
  }

  async function handleConvert() {
    if (!selectedFile || !outputFormat || isLocked) {
      return;
    }

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
          serverUrl: env.EXPO_PUBLIC_SERVER_URL,
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
        saveRecentToDb({
          id: result.success.jobId,
          inputName: selectedFile.name,
          outputName: `converted-${result.success.jobId}.${outputFormat}`,
          outputFormat,
          quality: "medium",
          sizeBytes: result.success.sizeBytes,
          createdAt: new Date().toISOString(),
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

  async function handleShare() {
    if (!jobId || !outputFormat) {
      return;
    }

    const downloadUrl = `${env.EXPO_PUBLIC_SERVER_URL}/download/${jobId}`;
    const target = `${FileSystem.cacheDirectory ?? ""}converted-${jobId}.${outputFormat}`;
    await FileSystem.downloadAsync(downloadUrl, target);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(target);
    }
  }

  function handleRetry() {
    setState("idle");
    setErrorMessage(null);
    setUploadPercent(0);
    setConversionPercent(0);
  }

  const ctaText =
    state === "uploading"
      ? "Uploading..."
      : state === "processing"
        ? "Converting..."
        : "Convert Now";

  return (
    <Container className="px-4" isScrollable={false}>
      <View className="flex-1 py-6">
        <View className="mb-4 space-y-1">
          <Text className="text-2xl font-semibold text-foreground">Convert your video or audio</Text>
          <Text className="text-sm text-muted">Upload, convert, and download in one flow.</Text>
        </View>

        <View className="mb-4 rounded-2xl border border-border bg-card p-4">
          {state === "idle" && (
            <Pressable className="min-h-40 items-center justify-center rounded-2xl bg-secondary px-4" onPress={handlePickFile}>
              {selectedFile ? (
                <View className="items-center gap-1">
                  <Text className="text-base font-medium text-foreground">{selectedFile.name}</Text>
                  <Text className="text-sm text-muted">{formatFileSize(selectedFile.size)}</Text>
                </View>
              ) : (
                <View className="items-center gap-1">
                  <Text className="text-base font-medium text-foreground">Tap to upload file</Text>
                  <Text className="text-sm text-muted">Choose video or audio file</Text>
                </View>
              )}
            </Pressable>
          )}

          {state === "uploading" && (
            <View className="min-h-40 items-center justify-center gap-3">
              <ActivityIndicator />
              <Text className="text-base text-foreground">Uploading...</Text>
              <Text className="text-sm text-muted">Uploading chunks {uploadPercent}%</Text>
            </View>
          )}

          {state === "processing" && (
            <View className="min-h-40 items-center justify-center gap-3">
              <ActivityIndicator />
              <Text className="text-base text-foreground">Converting...</Text>
              <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <View
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${conversionPercent}%` }}
                />
              </View>
              <Text className="text-sm text-muted">{conversionPercent}%</Text>
            </View>
          )}

          {state === "completed" && (
            <View className="min-h-40 items-center justify-center gap-3">
              <Text className="text-lg font-semibold text-foreground">Conversion Complete</Text>
              <Text className="text-sm text-muted">
                {selectedFile ? `${selectedFile.name.split(".")[0]}.${outputFormat}` : "Converted file ready"}
              </Text>
              <Pressable className="items-center rounded-2xl bg-primary px-5 py-3" onPress={handleShare}>
                <Text className="text-sm font-semibold text-primary-foreground">Share</Text>
              </Pressable>
            </View>
          )}

          {state === "error" && (
            <View className="min-h-40 items-center justify-center gap-3">
              <Text className="text-base font-semibold text-danger">Something went wrong</Text>
              <Text className="text-sm text-muted">{errorMessage ?? "Please try again."}</Text>
              <Pressable className="items-center rounded-2xl bg-warning px-5 py-3" onPress={handleRetry}>
                <Text className="text-sm font-semibold text-foreground">Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-foreground">Convert to</Text>
          <View className="flex-row flex-wrap gap-2">
            {allowedFormats.length === 0 ? (
              <Text className="text-sm text-muted">Select a file to view formats</Text>
            ) : (
              allowedFormats.map((format) => (
                <Pressable
                  key={format}
                  className={`rounded-xl px-3 py-2 ${outputFormat === format ? "bg-primary" : "bg-secondary"}`}
                  onPress={() => setOutputFormat(format)}
                  disabled={!selectedFile || isLocked}
                >
                  <Text
                    className={`text-sm font-medium ${outputFormat === format ? "text-primary-foreground" : "text-foreground"}`}
                  >
                    {format.toUpperCase()}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>

        {state !== "completed" && state !== "error" && (
          <Pressable
            className={`items-center rounded-2xl py-4 ${canConvert ? "bg-primary" : "bg-muted"}`}
            disabled={!canConvert}
            onPress={handleConvert}
          >
            <Text className="text-sm font-semibold text-primary-foreground">{ctaText}</Text>
          </Pressable>
        )}

        {errorMessage && state !== "error" ? (
          <Text className="mt-3 text-sm text-danger">{errorMessage}</Text>
        ) : null}
      </View>
    </Container>
  );
}
