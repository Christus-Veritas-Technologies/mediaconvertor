import { Ionicons } from "@expo/vector-icons";
import { Appearance, Switch, Text, useColorScheme, View } from "react-native";

import { Container } from "@/components/container";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  function toggleTheme(val: boolean) {
    Appearance.setColorScheme(val ? "dark" : "light");
  }

  return (
    <Container className="px-4" isScrollable>
      <View className="flex-1 gap-4 py-6">
        <View className="mb-2 gap-1">
          <Text className="text-2xl font-semibold text-foreground">Settings</Text>
          <Text className="text-sm text-muted">Customize your experience</Text>
        </View>

        {/* Appearance */}
        <View className="rounded-2xl bg-card overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">Appearance</Text>
          </View>
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-base font-medium text-foreground">Dark Mode</Text>
                <Text className="text-xs text-muted">{isDark ? "Dark theme active" : "Light theme active"}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#e4e4e7", true: "#7c3aed" }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Conversion */}
        <View className="rounded-2xl bg-card overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">Conversion</Text>
          </View>
          <View className="px-4 py-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name="options-outline" size={20} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">Default Quality</Text>
                <Text className="text-xs text-muted">Medium quality for all conversions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Storage */}
        <View className="rounded-2xl bg-card overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">Storage</Text>
          </View>
          <View className="px-4 py-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name="time-outline" size={20} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">History</Text>
                <Text className="text-xs text-muted">Keeps last 10 conversions</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Container>
  );
}
