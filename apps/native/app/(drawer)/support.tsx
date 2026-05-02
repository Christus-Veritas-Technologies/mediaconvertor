import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";

const FORMAT_ROWS = [
  { input: "MP4", outputs: "MP3, MP4" },
  { input: "MP3", outputs: "MP3" },
  { input: "JPEG / JPG", outputs: "JPEG, JPG, PNG, WebP" },
  { input: "PNG", outputs: "JPEG, JPG, PNG, WebP" },
  { input: "WebP", outputs: "JPEG, JPG, PNG, WebP" },
];

export default function SupportScreen() {
  return (
    <Container className="px-4" isScrollable>
      <View className="flex-1 gap-4 py-6">
        <View className="mb-2 gap-1">
          <Text className="text-2xl font-semibold text-foreground">Support</Text>
          <Text className="text-sm text-muted">Help and information</Text>
        </View>

        {/* About */}
        <View className="rounded-2xl bg-card overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">About</Text>
          </View>
          <View className="px-4 py-4 gap-2">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name="apps-outline" size={20} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-base font-medium text-foreground">MediaConvertor</Text>
                <Text className="text-xs text-muted">Version 1.0.0</Text>
              </View>
            </View>
            <Text className="mt-2 text-sm text-muted">
              Fast, reliable media conversion. Convert video, audio, and images directly on your device.
            </Text>
          </View>
        </View>

        {/* Supported Formats */}
        <View className="rounded-2xl bg-card overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">Supported Formats</Text>
          </View>
          <View className="px-4 py-3 gap-0">
            {FORMAT_ROWS.map((row, index) => (
              <View
                key={row.input}
                className={`flex-row items-center justify-between py-3 ${index < FORMAT_ROWS.length - 1 ? "border-b border-border" : ""}`}
              >
                <Text className="text-sm font-medium text-foreground">{row.input}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="arrow-forward" size={14} color="#a1a1aa" />
                  <Text className="text-sm text-muted">{row.outputs}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How to Use */}
        <View className="rounded-2xl bg-card overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">How to Use</Text>
          </View>
          <View className="px-4 py-3 gap-3">
            {[
              { step: "1", text: "Tap Dashboard and select your media file" },
              { step: "2", text: "Choose the output format" },
              { step: "3", text: "Tap Convert Now and wait" },
              { step: "4", text: "Share or save the converted file" },
            ].map((item) => (
              <View key={item.step} className="flex-row items-start gap-3">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Text className="text-xs font-bold text-primary">{item.step}</Text>
                </View>
                <Text className="flex-1 text-sm text-foreground">{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Max File Size */}
        <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="information-circle-outline" size={18} color="#d97706" />
            <Text className="text-sm font-semibold text-amber-800">File Size Limit</Text>
          </View>
          <Text className="text-sm text-amber-700">Maximum file size is 500 MB per conversion.</Text>
        </View>
      </View>
    </Container>
  );
}
