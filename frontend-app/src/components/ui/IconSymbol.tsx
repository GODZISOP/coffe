import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

// Map SF Symbol names (used in the layout) to MaterialIcons equivalents
const MAPPING: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'star.fill': 'star',
  'cart.fill': 'shopping-cart',
  'cart': 'shopping-cart',
  'person.fill': 'person',
  'list.bullet': 'list',
  'cup.and.saucer.fill': 'coffee',
  'plus': 'add',
  'minus': 'remove',
  'trash.fill': 'delete',
  'bolt.fill': 'bolt',
  'clock.fill': 'schedule',
};

export type IconSymbolName = keyof typeof MAPPING;

interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}

/**
 * An icon component that uses MaterialIcons on Android/Web
 * and maps SF Symbol names for consistency across the codebase.
 */
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  const iconName = MAPPING[name] ?? 'star';
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
