import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '../src/styles/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ritual Info</Text>
      <Text style={styles.body}>This modal provides additional context for your coffee journey.</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Return to Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.primary,
    ...theme.typography.headlineMd,
    marginBottom: 10,
  },
  body: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
    textDecorationLine: 'underline',
  }
});
