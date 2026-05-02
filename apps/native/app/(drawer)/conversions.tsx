import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";

type ConversionCategory = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  from: string[];
  to: string[];
};

const categories: ConversionCategory[] = [
  {
    title: "Video",
    description: "Convert MP4 or extract audio to MP3",
    icon: "film-outline",
    from: ["MP4"],
    to: ["MP3", "MP4"],
  },
  {
    title: "Audio",
    description: "Convert audio files to MP3",
    icon: "musical-notes-outline",
    from: ["MP3"],
    to: ["MP3"],
  },
  {
    title: "Images",
    description: "Convert between JPEG, PNG, and WebP",
    icon: "image-outline",
    from: ["JPEG", "PNG", "WebP"],
    to: ["JPEG", "JPG", "PNG", "WebP"],
  },
];

export default function ConversionsScreen() {
  const router = useRouter();

  return (
    <Container className="px-4" isScrollable>
      <View className="flex-1 gap-4 py-6">
        <View className="mb-2 gap-1">
          <Text className="text-2xl font-semibold text-foreground">Conversions</Text>
          <Text className="text-sm text-muted">Supported conversion types</Text>
        </View>

        {categories.map((category) => (
          <Pressable
            key={category.title}
            className="rounded-2xl bg-card p-4 active:opacity-70"
            onPress={() => router.push("/")}
          >
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name={category.icon} size={22} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{category.title}</Text>
                <Text className="text-xs text-muted">{category.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
            </View>

            <View className="flex-row flex-wrap gap-2">
              {category.from.map((fmt) => (
                <View key={fmt} className="rounded-lg bg-muted/30 px-2 py-1">
                  <Text className="text-xs font-medium text-muted">{fmt}</Text>
                </View>
              ))}
              <View className="items-center justify-center">
                <Ionicons name="arrow-forward" size={14} color="#a1a1aa" />
              </View>
              {category.to.map((fmt) => (
                <View key={fmt} className="rounded-lg bg-primary/10 px-2 py-1">
                  <Text className="text-xs font-medium text-primary">{fmt}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}

        <Pressable
          className="mt-2 items-center rounded-2xl bg-primary py-4"
          onPress={() => router.push("/")}
        >
          <Text className="text-base font-semibold text-primary-foreground">Start Converting</Text>
        </Pressable>
      </View>
    </Container>
  );
}
