import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../src/styles/theme';

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Coming Soon</Text>
      <Text style={styles.subtitle}>Our full artisanal collection is being curated.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineLg,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMd,
    textAlign: 'center',
    marginTop: 10,
  },
});
