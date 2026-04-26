import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  interpolate,
  withDelay
} from 'react-native-reanimated';
import { theme } from '../styles/theme';
import { IconSymbol } from './ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function AppLoader() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const steamY = useSharedValue(0);

  useEffect(() => {
    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Fade in
    opacity.value = withTiming(1, { duration: 1000 });

    // Steam animation
    steamY.value = withRepeat(
      withTiming(-20, { duration: 1500, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: interpolate(opacity.value, [0, 1], [0, 0.3]),
  }));

  const steamStyle = (delay: number) => useAnimatedStyle(() => ({
    transform: [{ translateY: steamY.value }],
    opacity: interpolate(steamY.value, [0, -10, -20], [0, 0.8, 0]),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Outer Ring */}
        <Animated.View style={[styles.ring, ringStyle]} />
        
        {/* Central Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <IconSymbol name="star.fill" size={48} color={theme.colors.primary} />
          
          {/* Animated Steam */}
          <View style={styles.steamContainer}>
             <Animated.View style={[styles.steam, steamStyle(0)]} />
             <Animated.View style={[styles.steam, styles.steamMiddle, steamStyle(400)]} />
             <Animated.View style={[styles.steam, steamStyle(800)]} />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity }]}>
          BREW
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity }]}>
          Awakening the senses...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    position: 'absolute',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    marginTop: 40,
    color: theme.colors.primary,
    ...theme.typography.headlineMd,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  subtitle: {
    marginTop: 10,
    color: theme.colors.outline,
    ...theme.typography.bodySm,
    letterSpacing: 2,
  },
  steamContainer: {
    position: 'absolute',
    top: -20,
    flexDirection: 'row',
    gap: 4,
  },
  steam: {
    width: 2,
    height: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
    opacity: 0.6,
  },
  steamMiddle: {
    height: 15,
    marginTop: -5,
  }
});
