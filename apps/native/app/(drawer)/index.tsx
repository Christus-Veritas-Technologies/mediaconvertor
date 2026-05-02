import {
  detectMediaKind,
  getAllowedOutputs,
  startConversion,
  type ConversionFile,
  type ConversionState,
  type OutputFormat,
  type QualityLevel,
} from "@MediaConvertor/conversion";
import { env } from "@MediaConvertor/env/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { saveRecentItem as saveRecentToDb } from "@/lib/recent-store";

export default function Home() {
  const [state, setState] = useState<ConversionState>("idle");
  const [selectedFile, setSelectedFile] = useState<ConversionFile | null>(null);
  const [mediaKind, setMediaKind] = useState<"audio" | "video" | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [quality, setQuality] = useState<QualityLevel>("medium");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [conversionPercent, setConversionPercent] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allowedFormats = useMemo(() => {
    if (!mediaKind) {
      return [] as readonly OutputFormat[];
    }
    return getAllowedOutputs(mediaKind);
  }, [mediaKind]);

  const canConvert =
    state === "idle" && selectedFile !== null && outputFormat !== null && allowedFormats.includes(outputFormat);

  async function handlePickFile() {
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
      setOutputFormat(nextFormats[0] ?? null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to read file.");
    }
  }

  async function handleConvert() {
    if (!selectedFile || !outputFormat) {
      return;
    }

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
          quality,
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

  return (
    <Container className="px-4" isScrollable={false}>
      <View className="flex-1 py-4 space-y-4">
        <View className="space-y-1">
          <Text className="text-xl font-semibold text-foreground">MediaConvertor</Text>
          <Text className="text-sm text-muted">Single-screen conversion workflow</Text>
        </View>

        <View className="rounded-2xl bg-secondary p-4 space-y-4">
          {state === "idle" && (
            <>
              <Pressable className="rounded-2xl bg-primary py-4 items-center" onPress={handlePickFile}>
                <Text className="text-sm font-semibold text-primary-foreground">
                  {selectedFile ? "Change File" : "Pick File"}
                </Text>
              </Pressable>

              {selectedFile ? (
                <Text className="text-sm text-foreground">{selectedFile.name}</Text>
              ) : (
                <Text className="text-sm text-muted">No file selected</Text>
              )}

              <View className="space-y-2">
                <Text className="text-sm text-foreground">Output Format</Text>
                <View className="flex-row flex-wrap gap-2">
                  {allowedFormats.map((format) => (
                    <Pressable
                      key={format}
                      className={`rounded-xl px-3 py-2 ${outputFormat === format ? "bg-primary" : "bg-background"}`}
                      onPress={() => setOutputFormat(format)}
                      disabled={!selectedFile}
                    >
                      <Text
                        className={`text-sm ${outputFormat === format ? "text-primary-foreground" : "text-foreground"}`}
                      >
                        {format.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="space-y-2">
                <Text className="text-sm text-foreground">Quality</Text>
                <View className="flex-row gap-2">
                  {(["low", "medium", "high"] as const).map((value) => (
                    <Pressable
                      key={value}
                      className={`rounded-xl px-3 py-2 ${quality === value ? "bg-primary" : "bg-background"}`}
                      onPress={() => setQuality(value)}
                    >
                      <Text className={quality === value ? "text-primary-foreground text-sm" : "text-foreground text-sm"}>
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                className={`rounded-2xl py-4 items-center ${canConvert ? "bg-primary" : "bg-muted"}`}
                disabled={!canConvert}
                onPress={handleConvert}
              >
                <Text className="text-sm font-semibold text-primary-foreground">Convert</Text>
              </Pressable>
            </>
          )}

          {state === "uploading" && (
            <View className="space-y-3 py-4">
              <ActivityIndicator />
              <Text className="text-base text-foreground">Uploading...</Text>
              <Text className="text-sm text-muted">{uploadPercent}%</Text>
            </View>
          )}

          {state === "processing" && (
            <View className="space-y-3 py-4">
              <ActivityIndicator />
              <Text className="text-base text-foreground">Converting...</Text>
              <Text className="text-sm text-muted">{conversionPercent}%</Text>
            </View>
          )}

          {state === "completed" && (
            <View className="space-y-3 py-2">
              <Text className="text-base font-semibold text-foreground">Conversion completed</Text>
              <Pressable className="rounded-2xl bg-primary py-4 items-center" onPress={handleShare}>
                <Text className="text-sm font-semibold text-primary-foreground">Download & Share</Text>
              </Pressable>
            </View>
          )}

          {state === "error" && (
            <View className="space-y-3 py-2">
              <Text className="text-sm text-danger">{errorMessage ?? "Conversion failed."}</Text>
              <Pressable className="rounded-2xl bg-warning py-4 items-center" onPress={handleRetry}>
                <Text className="text-sm font-semibold text-foreground">Retry</Text>
              </Pressable>
            </View>
          )}

          {errorMessage && state !== "error" ? (
            <Text className="text-sm text-danger">{errorMessage}</Text>
          ) : null}
        </View>
      </View>
    </Container>
  );
}
