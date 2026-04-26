import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  ZoomIn
} from 'react-native-reanimated';
import { theme } from '../styles/theme';
import { IconSymbol } from './ui/IconSymbol';

const { width, height } = Dimensions.get('window');

interface OrderSuccessOverlayProps {
  onComplete: () => void;
}

export default function OrderSuccessOverlay({ onComplete }: OrderSuccessOverlayProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 12 });
    checkmarkScale.value = withDelay(400, withSpring(1));

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  return (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut} 
      style={styles.overlay}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.iconCircle}>
          <Animated.View style={checkStyle}>
            <IconSymbol name="star.fill" size={60} color={theme.colors.primary} />
          </Animated.View>
        </View>
        
        <Text style={styles.title}>Ritual Confirmed</Text>
        <Text style={styles.subtitle}>Your artisanal brew is being prepared with intention.</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <IconSymbol name="clock.fill" size={16} color={theme.colors.outline} />
          <Text style={styles.infoText}>Estimated: 5-8 minutes</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>TRACK PROGRESS</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 10000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(188, 115, 78, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  title: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.outline,
    ...theme.typography.bodyMd,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.primary,
    marginVertical: 24,
    borderRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  infoText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelLg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelLg,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
