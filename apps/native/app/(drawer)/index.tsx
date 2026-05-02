import {
  appendRecent,
  detectMediaKind,
  getFileExtension,
  getFormatCardOptions,
  getSupportedOutputsForInputExtension,
  startConversion,
  validateConversionPair,
  type ConversionFile,
  type ConversionState,
  type OutputFormat,
  type RecentItem,
} from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Container } from "@/components/container";
import { readRecentItems, saveRecentItem as saveRecentToDb } from "@/lib/recent-store";

const DEFAULT_FORMAT_BY_INPUT: Record<string, OutputFormat> = {
  mp4: "mp3",
  mp3: "mp3",
  wav: "mp3",
  webp: "png",
  png: "webp",
  jpg: "png",
  jpeg: "png",
};

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

export default function Home() {
  const [state, setState] = useState<ConversionState>("idle");
  const [selectedFile, setSelectedFile] = useState<ConversionFile | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [conversionPercent, setConversionPercent] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatCards = useMemo(() => getFormatCardOptions(), []);

  const supportedOutputs = useMemo(() => {
    if (!selectedFile) {
      return [] as readonly OutputFormat[];
    }
    return getSupportedOutputsForInputExtension(getFileExtension(selectedFile.name));
  }, [selectedFile]);

  const isLocked = state === "uploading" || state === "processing";

  const canConvert = state === "idle" && !!selectedFile && !!outputFormat && !isLocked;

  async function handlePickFile() {
    if (isLocked) {
      return;
    }

    const picked = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["audio/mpeg", "video/mp4", "image/jpeg", "image/png", "image/webp"],
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

      detectMediaKind(file.name, file.mimeType);
      const nextSupported = getSupportedOutputsForInputExtension(getFileExtension(file.name));

      setSelectedFile(file);
      setOutputFormat(smartSelectFormat(file.name, nextSupported));
      setState("idle");
      setUploadPercent(0);
      setConversionPercent(0);
      setJobId(null);
      setErrorMessage(null);
    } catch (error) {
      setSelectedFile(null);
      setOutputFormat(null);
      setErrorMessage(error instanceof Error ? error.message : "Unsupported file.");
    }
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

        const item: RecentItem = {
          id: result.success.jobId,
          fileName: selectedFile.name,
          inputFormat: getFileExtension(selectedFile.name).toUpperCase(),
          outputFormat: outputFormat.toUpperCase(),
          createdAt: Date.now(),
          uri: `${env.EXPO_PUBLIC_SERVER_URL}/download/${result.success.jobId}`,
        };

        const nextRecent = appendRecent(readRecentItems(10), item);
        for (const recent of nextRecent) {
          saveRecentToDb(recent);
        }
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

        <Animated.View entering={FadeInDown.duration(220)} className="mb-4 rounded-2xl border border-border bg-card p-4">
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
                  <Text className="text-sm text-muted">Accepted: mp3, mp4, jpeg, webp, jpg, png</Text>
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
                <View className="h-2 rounded-full bg-primary" style={{ width: `${conversionPercent}%` }} />
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
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(220)} className="mb-4">
          <Text className="mb-2 text-sm font-medium text-foreground">Convert to</Text>
          <View className="flex-row flex-wrap gap-2">
            {formatCards.map((format) => {
              const isSupported = !selectedFile || supportedOutputs.includes(format);
              const isSelected = outputFormat === format;

              return (
                <Pressable
                  key={format}
                  className={`rounded-2xl border px-3 py-2 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : isSupported
                        ? "border-border bg-card"
                        : "border-border bg-muted"
                  }`}
                  disabled={isLocked}
                  onPress={() => handleFormatSelect(format)}
                >
                  <Text
                    className={`text-xs uppercase ${
                      isSelected ? "text-primary-foreground" : isSupported ? "text-muted" : "text-muted"
                    }`}
                  >
                    Convert to
                  </Text>
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected
                        ? "text-primary-foreground"
                        : isSupported
                          ? "text-foreground"
                          : "text-muted"
                    }`}
                  >
                    {format.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {state !== "completed" && state !== "error" && (
          <Animated.View entering={FadeInDown.delay(120).duration(220)}>
            <Pressable
              className={`items-center rounded-2xl py-4 ${canConvert ? "bg-primary" : "bg-muted"}`}
              disabled={!canConvert}
              onPress={handleConvert}
            >
              <Text className="text-sm font-semibold text-primary-foreground">{ctaText}</Text>
            </Pressable>
          </Animated.View>
        )}

        {errorMessage && state !== "error" ? (
          <Text className="mt-3 text-sm text-danger">{errorMessage}</Text>
        ) : null}

        <Animated.View entering={FadeInDown.delay(180).duration(220)} className="mt-6 gap-3">
          <View className="space-y-1">
            <Text className="text-lg font-semibold text-foreground">Popular conversions</Text>
            <Text className="text-sm text-muted">Quick ideas to help you start faster.</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {["MP4 to MP3", "MP4 to MP4", "MP3 to MP3", "JPG to PNG", "PNG to JPG", "WEBP to PNG"].map(
              (label) => (
                <View key={label} className="rounded-2xl border border-border bg-card px-3 py-2">
                  <Text className="text-xs font-medium text-foreground">{label}</Text>
                </View>
              ),
            )}
          </View>
        </Animated.View>
      </View>
    </Container>
  );
}
