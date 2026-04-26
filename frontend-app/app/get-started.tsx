import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp,
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  Easing,
  withSequence
} from 'react-native-reanimated';
import { Coffee, ChevronRight, Sparkles } from 'lucide-react-native';
import { theme } from '../src/styles/theme';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen() {
  const router = useRouter();
  
  // Floating animation for logo
  const floatValue = useSharedValue(0);
  
  // Glow animation
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + (glowOpacity.value - 0.3) * 0.5 }]
  }));

  return (
    <View style={styles.container}>
      {/* Premium Background Elements */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, floatingStyle]} entering={FadeInDown.duration(1000).delay(200)}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <View style={styles.iconWrapper}>
            <Coffee size={48} color={theme.colors.onPrimary} strokeWidth={1.5} />
          </View>
        </Animated.View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Animated.Text 
            entering={FadeInDown.duration(1000).delay(500)} 
            style={styles.title}
          >
            BREW
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.duration(1000).delay(700)} 
            style={styles.subtitle}
          >
            THE ARTISAN EXPERIENCE
          </Animated.Text>
          <Animated.Text 
            entering={FadeIn.duration(1000).delay(1000)} 
            style={styles.description}
          >
            Curated rituals for the modern connoisseur. Discover our exclusive collection of meticulously crafted beverages.
          </Animated.Text>
        </View>

        {/* Action Section */}
        <Animated.View 
          entering={FadeInUp.duration(1000).delay(1200)}
          style={styles.actionContainer}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Sparkles size={18} color={theme.colors.onPrimaryContainer} style={styles.buttonIconLeft} />
            <Text style={styles.buttonText}>BEGIN RITUAL</Text>
            <ChevronRight size={20} color={theme.colors.onPrimaryContainer} style={styles.buttonIconRight} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  bgCircleTop: {
    position: 'absolute',
    top: -width * 0.5,
    left: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: theme.colors.primary,
    opacity: 0.03,
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -width * 0.3,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: theme.colors.primary,
    opacity: 0.05,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'space-between',
    paddingTop: height * 0.15,
    paddingBottom: height * 0.08,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: -40,
  },
  title: {
    fontFamily: 'Noto Serif',
    fontSize: 54,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Manrope',
    fontSize: 13,
    color: theme.colors.secondary,
    letterSpacing: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Manrope',
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  actionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
    width: '100%',
    height: 60,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  buttonText: {
    color: theme.colors.onPrimaryContainer,
    fontFamily: 'Manrope',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  buttonIconLeft: {
    opacity: 0.8,
  },
  buttonIconRight: {
    opacity: 0.9,
  }
});
