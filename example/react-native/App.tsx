import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Exceptionless } from "@exceptionless/browser";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Exceptionless Example: { Exceptionless.config.serverUrl }</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
