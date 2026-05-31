import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";

import type { LogEntry } from "@exceptionless/react-native";
import { clearLogEntries, getLogEntries, subscribeToLogs } from "../logging";

const levelColors: Record<string, string> = {
  trace: "#9e9e9e",
  info: "#1976d2",
  warn: "#f57c00",
  error: "#d32f2f"
};

let nextId = 0;
interface LogItem extends LogEntry {
  id: number;
}

function toLogItems(entries: LogEntry[]): LogItem[] {
  return entries.map((e) => ({ ...e, id: nextId++ }));
}

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogItem[]>(() => toLogItems(getLogEntries()));
  const flatListRef = useRef<FlatList<LogItem>>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLogs(() => {
      setLogs(toLogItems(getLogEntries()));
    });
    return unsubscribe;
  }, []);

  const clearLogs = useCallback(() => clearLogEntries(), []);

  const renderItem = useCallback(({ item }: { item: LogItem }) => {
    const time = item.timestamp.toLocaleTimeString();
    const color = levelColors[item.level] ?? "#333";
    return (
      <View style={styles.logEntry}>
        <Text style={styles.logTime}>{time}</Text>
        <Text style={[styles.logLevel, { color }]}>{item.level.toUpperCase()}</Text>
        <Text style={styles.logMessage} numberOfLines={3}>
          {item.message}
        </Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: LogItem) => String(item.id), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.description}>Internal Exceptionless client logs. Shows queue processing, event submission, settings updates, and errors.</Text>
        <View style={styles.headerRow}>
          <Text style={styles.count}>{logs.length} entries</Text>
          <Button title="Clear" onPress={clearLogs} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={logs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.emptyText}>No log entries yet. Interact with the app to generate logs.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  count: {
    fontSize: 13,
    color: "#999"
  },
  list: {
    flex: 1
  },
  logEntry: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
    alignItems: "flex-start"
  },
  logTime: {
    fontSize: 11,
    color: "#999",
    width: 75,
    fontFamily: "Courier"
  },
  logLevel: {
    fontSize: 11,
    fontWeight: "700",
    width: 48,
    fontFamily: "Courier"
  },
  logMessage: {
    fontSize: 12,
    color: "#333",
    flex: 1
  },
  emptyText: {
    padding: 24,
    textAlign: "center",
    color: "#999",
    fontSize: 14
  }
});
