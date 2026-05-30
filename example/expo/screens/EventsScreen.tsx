import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Exceptionless } from "@exceptionless/react-native";

export default function EventsScreen() {
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const submitLog = async (level: "info" | "warn" | "error") => {
    const message = `Test ${level} log from Expo app`;
    await Exceptionless.submitLog("EventsScreen", message, level);
    setStatus(`Log submitted: [${level}] ${message}`);
  };

  const submitFeatureUsage = async () => {
    await Exceptionless.submitFeatureUsage("ExpoSampleApp");
    setStatus("Feature usage submitted: ExpoSampleApp");
  };

  const setUserIdentity = () => {
    if (email || name) {
      Exceptionless.config.setUserIdentity(email, name);
      setStatus(`User identity set: ${email} (${name})`);
    } else {
      setStatus("Please enter email or name");
    }
  };

  const clearUserIdentity = () => {
    Exceptionless.config.setUserIdentity("", "");
    setEmail("");
    setName("");
    setStatus("User identity cleared");
  };

  const submitSessionStart = async () => {
    await Exceptionless.submitSessionStart();
    setStatus("Session start submitted");
  };

  const submitSessionEnd = async () => {
    await Exceptionless.submitSessionEnd();
    setStatus("Session end submitted");
  };

  const getLastReferenceId = () => {
    const refId = Exceptionless.getLastReferenceId();
    setStatus(`Last reference ID: ${refId ?? "(none)"}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.description}>Submit various event types to Exceptionless.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <Button title="Submit Info Log" onPress={() => submitLog("info")} />
        <View style={styles.spacer} />
        <Button title="Submit Warning Log" onPress={() => submitLog("warn")} />
        <View style={styles.spacer} />
        <Button title="Submit Error Log" onPress={() => submitLog("error")} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Usage</Text>
        <Button title="Submit Feature Usage" onPress={submitFeatureUsage} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Identity</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <Button title="Set User Identity" onPress={setUserIdentity} />
        <View style={styles.spacer} />
        <Button title="Clear User Identity" onPress={clearUserIdentity} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sessions</Text>
        <Button title="Start Session" onPress={submitSessionStart} />
        <View style={styles.spacer} />
        <Button title="End Session" onPress={submitSessionEnd} />
        <View style={styles.spacer} />
        <Button title="Get Last Reference ID" onPress={getLastReferenceId} />
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  spacer: {
    height: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff"
  },
  statusBox: {
    padding: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    marginTop: 16
  },
  statusText: {
    fontSize: 13,
    color: "#2e7d32"
  }
});
