import { useRef, useState } from "react";
import type { ReactElement } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { Exceptionless, ExceptionlessErrorBoundary } from "@exceptionless/react-native";

function CrashyComponent(): ReactElement {
  throw new Error("Component crashed inside error boundary!");
}

export default function ErrorsScreen() {
  const [boundaryKey, setBoundaryKey] = useState(0);
  const [showCrashy, setShowCrashy] = useState(false);
  const [status, setStatus] = useState("");
  const stressRunning = useRef(false);

  const throwUnhandledError = () => {
    setStatus("Throwing unhandled error...");
    throw new Error("Unhandled error from button press");
  };

  const throwPromiseRejection = () => {
    setStatus("Triggering unhandled promise rejection...");
    void Promise.reject(new Error("Unhandled promise rejection"));
  };

  const submitCaughtError = async () => {
    try {
      throw new Error("This error was caught in try/catch");
    } catch (error) {
      if (error instanceof Error) {
        await Exceptionless.submitException(error);
        setStatus(`Submitted: ${error.message}`);
      }
    }
  };

  const triggerErrorBoundary = () => {
    setShowCrashy(true);
  };

  const resetErrorBoundary = () => {
    setShowCrashy(false);
    setBoundaryKey((key) => key + 1);
    setStatus("Error boundary reset");
  };

  const stressTest = () => {
    if (stressRunning.current) return;
    stressRunning.current = true;
    setStatus("🔥 Stress test: submitting 50 errors rapidly...");
    const start = Date.now();
    let count = 0;

    for (let i = 0; i < 50; i++) {
      try {
        throw new Error(`Stress test error #${i + 1}`);
      } catch (error) {
        if (error instanceof Error) {
          void Exceptionless.submitException(error);
          count++;
        }
      }
    }

    const elapsed = Date.now() - start;
    setStatus(`✅ Submitted ${count} errors in ${elapsed}ms. UI should remain responsive.`);
    stressRunning.current = false;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.description}>Test various error scenarios to verify Exceptionless captures them.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Handled Errors</Text>
        <Button title="Submit Caught Error (try/catch)" onPress={submitCaughtError} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unhandled Errors</Text>
        <Text style={styles.hint}>
          These trigger unhandled error handlers. In dev mode, React Native shows a red error screen — dismiss it to continue. Exceptionless captures the error
          automatically.
        </Text>
        <Button title="Throw Unhandled Error" onPress={throwUnhandledError} />
        <View style={styles.spacer} />
        <Button title="Unhandled Promise Rejection" onPress={throwPromiseRejection} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Boundary</Text>
        <ExceptionlessErrorBoundary
          key={boundaryKey}
          fallback={
            <View>
              <Text style={styles.errorText}>Component crashed! Error was sent to Exceptionless.</Text>
              <Button title="Reset" onPress={resetErrorBoundary} />
            </View>
          }
        >
          {showCrashy ? <CrashyComponent /> : <Button title="Trigger Error Boundary" onPress={triggerErrorBoundary} />}
        </ExceptionlessErrorBoundary>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Stress Test</Text>
        <Text style={styles.hint}>Rapidly submits 50 errors to verify the UI stays responsive and the SDK doesn't freeze the app.</Text>
        <Button title="Submit 50 Errors Rapidly" onPress={stressTest} color="#d32f2f" />
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
  hint: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 8
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
  },
  errorText: {
    color: "#c62828",
    marginBottom: 8
  }
});
