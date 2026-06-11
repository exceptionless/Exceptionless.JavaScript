import Constants from "expo-constants";
import * as Device from "expo-device";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Tabs, type TabSelectedEvent } from "react-native-screens";
import { Exceptionless } from "@exceptionless/react-native";

import { callbackLog, getLogEntries, subscribeToLogs } from "./logging";
import ErrorsScreen from "./screens/ErrorsScreen";
import EventsScreen from "./screens/EventsScreen";
import LogsScreen from "./screens/LogsScreen";

type TabKey = "Errors" | "Events" | "Logs";

const appTabs: Array<{ icon: string; key: TabKey; title: string }> = [
  { icon: "exclamationmark.triangle", key: "Errors", title: "Errors" },
  { icon: "tray.and.arrow.up", key: "Events", title: "Events" },
  { icon: "list.bullet.rectangle", key: "Logs", title: "Logs" }
];

const serverUrl = getServerUrl();

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

function NativeTabs() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("Errors");
  const [baseProvenance, setBaseProvenance] = useState(0);
  const navStateRequest = useMemo(() => ({ baseProvenance, selectedScreenKey: selectedTab }), [baseProvenance, selectedTab]);

  const handleTabSelected = (event: { nativeEvent: TabSelectedEvent }) => {
    setSelectedTab(event.nativeEvent.selectedScreenKey as TabKey);
    setBaseProvenance(event.nativeEvent.provenance);
  };

  if (Platform.OS === "web") {
    const ActiveScreen = selectedTab === "Errors" ? ErrorsScreen : selectedTab === "Events" ? EventsScreen : LogsScreen;

    return (
      <View style={styles.webTabs}>
        <View style={styles.webTabContent}>
          <ActiveScreen />
        </View>
        <View style={styles.webTabBar}>
          {appTabs.map((tab) => (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === tab.key }}
              onPress={() => setSelectedTab(tab.key)}
              style={styles.webTabButton}
            >
              <Text style={[styles.webTabLabel, selectedTab === tab.key && styles.webTabLabelActive]}>{tab.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <Tabs.Host
      colorScheme="light"
      ios={{
        tabBarControllerMode: "tabBar",
        tabBarMinimizeBehavior: "never",
        tabBarTintColor: "#0f172a"
      }}
      nativeContainerStyle={styles.nativeTabsContainer}
      navStateRequest={navStateRequest}
      onTabSelected={handleTabSelected}
      rejectStaleNavStateUpdates
    >
      {appTabs.map((tab) => {
        const Screen = tab.key === "Errors" ? ErrorsScreen : tab.key === "Events" ? EventsScreen : LogsScreen;

        return (
          <Tabs.Screen ios={{ icon: { name: tab.icon, type: "sfSymbol" } }} key={tab.key} screenKey={tab.key} style={styles.nativeTabScreen} title={tab.title}>
            <Screen />
          </Tabs.Screen>
        );
      })}
    </Tabs.Host>
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
      <View style={styles.appShell}>
        <TopDiagnostics />
        <NativeTabs />
      </View>
      <StatusBar style="auto" />
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
  nativeTabsContainer: {
    backgroundColor: "#fff"
  },
  nativeTabScreen: {
    backgroundColor: "#fff"
  },
  webTabs: {
    flex: 1
  },
  webTabBar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopColor: "#e5e7eb",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 72,
    paddingBottom: 12,
    paddingTop: 8
  },
  webTabButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  webTabContent: {
    flex: 1
  },
  webTabLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700"
  },
  webTabLabelActive: {
    color: "#0f172a"
  }
});
