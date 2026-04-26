import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../src/styles/theme';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../src/context/CartProvider';
import { supabase } from '../src/services/supabase';

import Skeleton from '../src/components/ui/Skeleton';

export default function DrinkDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState('Oat Milk');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert("Error", "Could not load ritual details.");
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: `${product.id}-${Date.now()}`, 
      name: product.name,
      price: product.price,
      image: product.image_url || product.image,
      quantity: quantity,
      options: `${size}, ${milk}`
    });
    Alert.alert("Added to Ritual", "Your selection is waiting in the cart.");
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Skeleton height={400} width="100%" />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Skeleton width="60%" height={32} />
            <Skeleton width="20%" height={32} />
          </View>
          <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
          <Skeleton width="90%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width={180} height={40} borderRadius={20} style={{ marginTop: 24 }} />
          
          <View style={{ marginTop: 30 }}>
            <Skeleton width={100} height={20} />
            <View style={[styles.row, { marginTop: 12 }]}>
              <Skeleton flex={1} height={80} borderRadius={12} />
              <Skeleton flex={1} height={80} borderRadius={12} />
              <Skeleton flex={1} height={80} borderRadius={12} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.onSurface }}>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BREW</Text>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="star.fill" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Hero Product Image */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: product.image_url || product.image }}
            style={styles.heroImage}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>${parseFloat(product.price).toFixed(2)}</Text>
          </View>
          <Text style={styles.description}>
            {product.description || "A masterfully crafted selection from our artisanal collection."}
          </Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
              <Text style={styles.toggleTextActive}>Hot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleButton}>
              <Text style={styles.toggleText}>Iced</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SELECT SIZE</Text>
            <View style={styles.row}>
              {['Small', 'Medium', 'Large'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sizeBox, size === s && styles.sizeBoxActive]}
                  onPress={() => setSize(s)}
                >
                  <IconSymbol name="star.fill" size={24} color={size === s ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                  <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MILK SELECTION</Text>
            <View style={styles.milkRow}>
              {['Whole Milk', 'Oat Milk', 'Almond Milk'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.milkPill, milk === m && styles.milkPillActive]}
                  onPress={() => setMilk(m)}
                >
                  <Text style={[styles.milkText, milk === m && styles.milkTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <View style={styles.quantityControl}>
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qBtn}>
              <IconSymbol name="minus" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qText}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qBtn}>
              <IconSymbol name="plus" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>Add to Cart — ${(product.price * quantity).toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 40,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(22, 19, 17, 0.8)',
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    color: theme.colors.primary,
    ...theme.typography.headlineMd,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  heroSection: {
    width: '100%',
    height: 400,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: theme.spacing.md,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.primary,
    ...theme.typography.headlineMd,
    flex: 1,
  },
  price: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMd,
    marginTop: theme.spacing.sm,
    lineHeight: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.full,
    padding: 4,
    width: 180,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.rounded.full,
  },
  toggleActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  toggleTextActive: {
    color: theme.colors.onPrimaryContainer,
    ...theme.typography.labelLg,
  },
  toggleText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelLg,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.secondary,
    ...theme.typography.labelLg,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sizeBox: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    gap: 4,
  },
  sizeBoxActive: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderColor: theme.colors.primaryContainer,
  },
  sizeText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelMd,
  },
  sizeTextActive: {
    color: theme.colors.onSurface,
  },
  milkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  milkPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  milkPillActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primaryContainer,
  },
  milkText: {
    color: theme.colors.onSurface,
    ...theme.typography.labelMd,
  },
  milkTextActive: {
    color: theme.colors.onPrimaryContainer,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomContent: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.rounded.md,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  qBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  qText: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: theme.colors.primaryContainer,
    height: 56,
    borderRadius: theme.rounded.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: theme.colors.onPrimaryContainer,
    ...theme.typography.headlineMd,
    fontSize: 18,
  },
});
