import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { GlassView } from "expo-glass-effect";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Exceptionless } from "@exceptionless/react-native";

import { callbackLog, getLogEntries, subscribeToLogs } from "./logging";
import ErrorsScreen from "./screens/ErrorsScreen";
import EventsScreen from "./screens/EventsScreen";
import LogsScreen from "./screens/LogsScreen";

type TabParamList = {
  Errors: undefined;
  Events: undefined;
  Logs: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const serverUrl = getServerUrl();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{label}</Text>;
}

/**
 * Resolves the dev server URL based on the current platform.
 * - Web and iOS Simulator: localhost reaches the host Mac.
 * - Android Emulator: 10.0.2.2 reaches the host machine.
 * - Real Android devices: need the dev machine's IP, extracted from Expo's hostUri.
 */
function getServerUrl(): string {
  if (!__DEV__ || Platform.OS === "web" || Platform.OS === "ios") {
    return "http://localhost:7110";
  }

  if (!Device.isDevice) {
    return "http://10.0.2.2:7110";
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    try {
      const hostname = new URL(`http://${hostUri}`).hostname;
      return `http://${hostname}:7110`;
    } catch {
      // Fall through to default
    }
  }

  return "http://localhost:7110";
}

function TopDiagnostics() {
  const [logs, setLogs] = useState(() => getLogEntries());
  const latestLog = logs.at(-1);
  const errorCount = useMemo(() => logs.filter((entry) => entry.level === "error").length, [logs]);

  useEffect(() => subscribeToLogs(() => setLogs(getLogEntries())), []);

  return (
    <SafeAreaView edges={["top"]} style={styles.diagnosticsSafeArea}>
      <View style={styles.diagnostics}>
        <View style={styles.diagnosticsTitleRow}>
          <Text style={styles.diagnosticsTitle}>Exceptionless Expo</Text>
          <Text style={styles.diagnosticsPill}>SDK 56</Text>
        </View>
        <Text style={styles.diagnosticsServer} numberOfLines={1}>
          {serverUrl}
        </Text>
        <View style={styles.diagnosticsMetaRow}>
          <Text style={styles.diagnosticsMeta}>{logs.length} logs</Text>
          <Text style={styles.diagnosticsMeta}>{errorCount} errors</Text>
          <Text style={styles.diagnosticsMeta}>sessions on</Text>
        </View>
        <Text style={styles.latestLog} numberOfLines={2}>
          {latestLog ? `[${latestLog.level.toUpperCase()}] ${latestLog.message}` : "Waiting for Exceptionless startup logs..."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    void Exceptionless.startup((config) => {
      config.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
      config.serverUrl = serverUrl;
      config.services.log = callbackLog;
      config.defaultTags.push("Example", "Expo");
      config.useSessions(true, 60000, true);
    });
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={styles.appShell}>
          <TopDiagnostics />
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: "#0f172a",
              tabBarInactiveTintColor: "#64748b",
              tabBarLabelStyle: styles.tabLabel,
              tabBarStyle: styles.tabBar,
              tabBarBackground: () => <GlassView glassEffectStyle="regular" isInteractive style={StyleSheet.absoluteFill} tintColor="rgba(255,255,255,0.58)" />
            }}
          >
            <Tab.Screen
              name="Errors"
              component={ErrorsScreen}
              options={{
                title: "Errors",
                tabBarIcon: ({ focused }) => <TabIcon label="!" focused={focused} />
              }}
            />
            <Tab.Screen
              name="Events"
              component={EventsScreen}
              options={{
                title: "Events",
                tabBarIcon: ({ focused }) => <TabIcon label="|" focused={focused} />
              }}
            />
            <Tab.Screen
              name="Logs"
              component={LogsScreen}
              options={{
                title: "Logs",
                tabBarIcon: ({ focused }) => <TabIcon label="#" focused={focused} />
              }}
            />
          </Tab.Navigator>
        </View>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: "#fff"
  },
  diagnosticsSafeArea: {
    backgroundColor: "#fff"
  },
  diagnostics: {
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  diagnosticsTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  diagnosticsTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700"
  },
  diagnosticsPill: {
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    color: "#3730a3",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  diagnosticsServer: {
    color: "#475569",
    fontSize: 12,
    marginTop: 4
  },
  diagnosticsMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  diagnosticsMeta: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    color: "#334155",
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  latestLog: {
    color: "#111827",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8
  },
  tabBar: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderTopColor: "rgba(148,163,184,0.22)",
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    height: 78,
    paddingBottom: 14,
    paddingTop: 8,
    position: "absolute",
    shadowColor: "#0f172a",
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  tabIcon: {
    color: "#64748b",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20
  },
  tabIconFocused: {
    color: "#0f172a"
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700"
  }
});
