import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { IconSymbol } from '../../src/components/ui/IconSymbol';
import { useCart } from '../../src/context/CartProvider';
import { supabase } from '../../src/services/supabase';
import { ActivityIndicator, Alert } from 'react-native';


export default function CartScreen() {
  const router = useRouter();
  const { items, total, removeFromCart, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  const subtotal = total;
  const sustainabilityFee = items.length > 0 ? 0.75 : 0;
  const tax = subtotal * 0.08;
  const finalTotal = subtotal + sustainabilityFee + tax;

  const handlePlaceOrder = async () => {
    try {
      setIsPlacingOrder(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Sign In Required', 'Please join the ritual before placing an order.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/login') }
        ]);
        return;
      }

      const orderData = {
        user_id: user.id,
        total_amount: finalTotal,
        items: items,
        status: 'pending'
      };

      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) throw error;

      clearCart();
      router.push('/tracking');
    } catch (error: any) {
      console.error('Order Error:', error);
      Alert.alert('Order Failed', error.message || 'We could not complete your ritual at this time.');
    } finally {
      setIsPlacingOrder(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Selection</Text>
        <Text style={styles.subtitle}>Review your artisanal ritual items.</Text>
      </View>

      <View style={styles.itemsContainer}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={64} color={theme.colors.outline} />
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <TouchableOpacity onPress={() => router.push('/')} style={styles.startRitualBtn}>
              <Text style={styles.startRitualText}>START A RITUAL</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.options}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.quantityText}>×{item.quantity}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <IconSymbol name="trash.fill" size={20} color="#ffb4ab" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.pickupSection}>
        <Text style={styles.pickupTitle}>PICKUP RITUAL</Text>
        <View style={styles.pickupOptions}>
          <TouchableOpacity style={[styles.pickupOption, styles.pickupOptionActive]}>
            <IconSymbol name="bolt.fill" size={24} color={theme.colors.primary} />
            <View style={styles.pickupOptionTextContainer}>
              <Text style={styles.pickupOptionLabel}>ASAP</Text>
              <Text style={styles.pickupOptionDesc}>Ready in 5-8 mins</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickupOption}>
            <IconSymbol name="clock.fill" size={24} color={theme.colors.outline} />
            <View style={styles.pickupOptionTextContainer}>
              <Text style={styles.pickupOptionLabel}>Schedule</Text>
              <Text style={styles.pickupOptionDesc}>Pick a specific time</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sustainability Fee</Text>
          <Text style={styles.summaryValue}>${sustainabilityFee.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowBorder]}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.checkoutButton, (items.length === 0 || isPlacingOrder) && styles.checkoutButtonDisabled]} 
        onPress={handlePlaceOrder} 
        disabled={items.length === 0 || isPlacingOrder}
      >
        {isPlacingOrder ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <>
            <Text style={styles.checkoutButtonText}>PLACE RITUAL ORDER</Text>
            <IconSymbol name="chevron.right" size={24} color={theme.colors.onPrimary} />
          </>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  title: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineLg,
  },
  subtitle: {
    color: theme.colors.outline,
    ...theme.typography.bodySm,
    marginTop: theme.spacing.xs,
  },
  itemsContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cartItem: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceContainerHigh,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: theme.rounded.sm,
  },
  itemDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  itemName: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
    fontWeight: '600',
  },
  itemDesc: {
    color: theme.colors.outline,
    ...theme.typography.bodySm,
    marginTop: 4,
  },
  itemPrice: {
    color: theme.colors.primary,
    ...theme.typography.bodyMd,
    fontWeight: 'bold',
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityText: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.outline,
    ...theme.typography.bodyLg,
  },
  startRitualBtn: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  startRitualText: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
  },
  pickupSection: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  pickupTitle: {
    color: theme.colors.onSurface,
    ...theme.typography.labelLg,
    marginBottom: theme.spacing.md,
  },
  pickupOptions: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  pickupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.md,
    borderRadius: theme.rounded.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickupOptionActive: {
    borderColor: theme.colors.primary,
  },
  pickupOptionTextContainer: {
    marginLeft: theme.spacing.sm,
  },
  pickupOptionLabel: {
    color: theme.colors.onSurface,
    ...theme.typography.labelLg,
  },
  pickupOptionDesc: {
    color: theme.colors.outline,
    ...theme.typography.bodySm,
  },
  summarySection: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  summaryLabel: {
    color: theme.colors.outline,
    ...theme.typography.bodyMd,
  },
  summaryValue: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
  },
  totalValue: {
    color: theme.colors.primary,
    ...theme.typography.headlineMd,
  },
  checkoutButton: {
    margin: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.md,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelLg,
  },
});
