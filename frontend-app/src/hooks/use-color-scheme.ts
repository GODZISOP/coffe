import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Thin wrapper around React Native's useColorScheme.
 * The app currently uses a dark theme by default, but this hook
 * allows future light/dark mode toggling.
 */
export function useColorScheme() {
  return useRNColorScheme() ?? 'dark';
}
