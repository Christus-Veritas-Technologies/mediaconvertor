import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import React, { useCallback } from "react";
import { Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

function DrawerLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <Drawer
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        headerRight: renderThemeToggle,
        drawerStyle: { backgroundColor: themeColorBackground },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Converter",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Converter</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="swap-horizontal-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="recent"
        options={{
          headerTitle: "Recent",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Recent</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <MaterialIcons
              name="history"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
    </Drawer>
  );
}

export default DrawerLayout;
