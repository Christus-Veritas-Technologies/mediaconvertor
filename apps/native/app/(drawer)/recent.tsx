import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { deleteRecentItem, readRecentItems } from "@/lib/recent-store";
import type { RecentItem } from "@MediaConvertor/conversion";

function formatRelative(createdAt: number): string {
  const delta = Date.now() - createdAt;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentScreen() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setItems(readRecentItems(10));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleOpen(item: RecentItem) {
    try {
      if (!item.uri) {
        throw new Error("File not available");
      }

      let targetUri = item.uri;

      if (item.uri.startsWith("http")) {
        const ext = item.outputFormat.toLowerCase();
        const localTarget = `${FileSystem.cacheDirectory ?? ""}${item.id}.${ext}`;
        const downloaded = await FileSystem.downloadAsync(item.uri, localTarget);
        targetUri = downloaded.uri;
      }

      const info = await FileSystem.getInfoAsync(targetUri);
      if (!info.exists) {
        deleteRecentItem(item.id);
        refresh();
        throw new Error("File not available");
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri);
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "File not available");
    }
  }

  return (
    <Container className="px-4" isScrollable={false}>
      <View className="flex-1 gap-4 py-4">
        <Text className="text-xl font-semibold text-foreground">Recent</Text>

        {items.length === 0 ? (
          <View className="min-h-36 items-center justify-center rounded-2xl bg-secondary p-4">
            <View className="mb-2 h-12 w-12 rounded-2xl bg-background" />
            <Text className="text-sm text-muted">No recent conversions yet</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} className="rounded-2xl bg-secondary p-4">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {item.fileName}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {item.inputFormat} → {item.outputFormat}
              </Text>
              <Text className="mt-1 text-xs text-muted">{formatRelative(item.createdAt)}</Text>

              <Pressable className="mt-3 items-center rounded-xl bg-primary py-2" onPress={() => void handleOpen(item)}>
                <Text className="text-xs font-semibold text-primary-foreground">Open File</Text>
              </Pressable>
            </View>
          ))
        )}

        {errorMessage ? <Text className="text-sm text-danger">{errorMessage}</Text> : null}
      </View>
    </Container>
  );
}
