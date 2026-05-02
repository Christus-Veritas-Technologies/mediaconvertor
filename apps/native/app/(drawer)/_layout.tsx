import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import React from "react";
import { Text } from "react-native";

function DrawerLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  return (
    <Drawer
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        drawerStyle: { backgroundColor: themeColorBackground },
        drawerActiveTintColor: "#7c3aed",
        drawerInactiveTintColor: themeColorForeground,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Dashboard",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Dashboard</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="conversions"
        options={{
          headerTitle: "Conversions",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Conversions</Text>
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
          headerTitle: "History",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>History</Text>
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
      <Drawer.Screen
        name="settings"
        options={{
          headerTitle: "Settings",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Settings</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="support"
        options={{
          headerTitle: "Support",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Support</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="help-circle-outline"
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
