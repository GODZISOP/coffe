import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
} from 'react-native-reanimated';
import { theme } from '../../styles/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  flex?: number;
  count?: number;
  spacing?: number;
  style?: ViewStyle;
}

export default function Skeleton({ 
  width, 
  height, 
  borderRadius, 
  flex, 
  count = 1, 
  spacing = 8, 
  style 
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderSkeleton = (index: number) => (
    <Animated.View 
      key={index}
      style={[
        styles.skeleton, 
        { 
          width: width || '100%', 
          height: height || 20, 
          borderRadius: borderRadius ?? theme.rounded.sm,
          flex: flex,
          marginBottom: index < count - 1 ? spacing : 0
        }, 
        style,
        animatedStyle
      ]} 
    />
  );

  if (count > 1) {
    return (
      <View>
        {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
      </View>
    );
  }

  return renderSkeleton(0);
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
});
