import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { readRecentItems } from "@/lib/recent-store";
import type { ConversionRecentItem } from "@MediaConvertor/conversion";

export default function RecentScreen() {
  const [items, setItems] = useState<ConversionRecentItem[]>([]);

  const refresh = useCallback(() => {
    setItems(readRecentItems(10));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <Container className="px-4" isScrollable={false}>
      <View className="flex-1 gap-4 py-4">
        <Text className="text-xl font-semibold text-foreground">Recent</Text>

        {items.length === 0 ? (
          <View className="rounded-2xl bg-secondary p-4">
            <Text className="text-sm text-muted">No conversions yet.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} className="rounded-2xl bg-secondary p-4">
              <Text className="text-base font-semibold text-foreground">{item.inputName}</Text>
              <Text className="text-sm text-muted mt-1">
                {item.outputFormat.toUpperCase()} · {item.quality}
              </Text>
            </View>
          ))
        )}
      </View>
    </Container>
  );
}
