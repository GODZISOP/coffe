import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { IconSymbol } from '../../src/components/ui/IconSymbol';
import { useCart } from '../../src/context/CartProvider';
import { supabase } from '../../src/services/supabase';
import OrderSuccessOverlay from '../../src/components/OrderSuccessOverlay';
import Skeleton from '../../src/components/ui/Skeleton';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  const { items, total, removeFromCart, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = React.useState<any>(null);
  const [showAddressPicker, setShowAddressPicker] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchAddresses();
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
    }, [])
  );

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (data && data.length > 0) {
        setAddresses(data);
        if (!selectedAddress) setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

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

      if (!selectedAddress) {
        Alert.alert('Address Required', 'Please select a delivery location.');
        return;
      }

      const orderData = {
        user_id: user.id,
        total_amount: finalTotal,
        items: items,
        status: 'pending',
        delivery_address: selectedAddress
      };

      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) throw error;

      clearCart();
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Order Error:', error);
      Alert.alert('Order Failed', error.message || 'We could not complete your ritual.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={200} height={32} />
          <Skeleton width={250} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={{ padding: 20 }}>
          <Skeleton height={100} borderRadius={20} style={{ marginBottom: 12 }} />
          <Skeleton height={100} borderRadius={20} style={{ marginBottom: 12 }} />
          <Skeleton height={150} borderRadius={20} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        {showSuccess && (
          <OrderSuccessOverlay 
            onComplete={() => {
              setShowSuccess(false);
              router.push('/tracking');
            }} 
          />
        )}
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
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.itemImage}
                  transition={200}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
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

        {items.length > 0 && (
          <>
            <View style={styles.deliverySection}>
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryTitleContainer}>
                  <IconSymbol name="bicycle" size={20} color={theme.colors.primary} />
                  <Text style={styles.deliveryTitle}>DELIVER TO</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddressPicker(true)}>
                  <Text style={styles.changeAction}>Change</Text>
                </TouchableOpacity>
              </View>

              {selectedAddress ? (
                <View style={styles.selectedAddressCard}>
                  <View style={styles.addressInfoMain}>
                    <Text style={styles.selectedAddressLabel}>{selectedAddress.label}</Text>
                    <Text style={styles.selectedAddressText} numberOfLines={1}>
                      {selectedAddress.address}, {selectedAddress.city}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addAddressPrompt}
                  onPress={() => router.push('/addresses')}
                >
                  <IconSymbol name="plus" size={20} color={theme.colors.primary} />
                  <Text style={styles.addAddressText}>Add a ritual location</Text>
                </TouchableOpacity>
              )}
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
              style={[styles.checkoutButton, isPlacingOrder && styles.checkoutButtonDisabled]} 
              onPress={handlePlaceOrder} 
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>PLACE RITUAL ORDER</Text>
                  <IconSymbol name="chevron.right" size={24} color="white" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showAddressPicker && (
        <AddressPickerModal 
          addresses={addresses}
          selectedId={selectedAddress?.id}
          onSelect={(addr: any) => {
            setSelectedAddress(addr);
            setShowAddressPicker(false);
          }}
          onClose={() => setShowAddressPicker(false)}
          onAddNew={() => {
            setShowAddressPicker(false);
            router.push('/addresses');
          }}
        />
      )}
    </View>
  );
}

function AddressPickerModal({ addresses, selectedId, onSelect, onClose, onAddNew }: any) {
  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBlur} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choose Delivery Ritual</Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol name="xmark.circle.fill" size={24} color={theme.colors.outline} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalList}>
          {addresses.map((addr: any) => (
            <TouchableOpacity 
              key={addr.id} 
              style={[styles.modalAddressCard, selectedId === addr.id && styles.modalAddressCardActive]}
              onPress={() => onSelect(addr)}
            >
              <View style={styles.modalAddressLeft}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=100' }} 
                  style={styles.staticMap}
                  transition={200}
                  contentFit="cover"
                />
                <View style={styles.modalAddressTextContainer}>
                  <Text style={styles.modalAddressLabel}>{addr.label}</Text>
                  <Text style={styles.modalAddressStreet} numberOfLines={2}>{addr.address}, {addr.city}</Text>
                </View>
              </View>
              {selectedId === addr.id && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.modalAddNewBtn} onPress={onAddNew}>
            <IconSymbol name="plus.circle.fill" size={24} color={theme.colors.primary} />
            <Text style={styles.modalAddNewText}>Add New Location</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    paddingTop: 60,
  },
  title: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineLg,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.colors.outline,
    ...theme.typography.bodySmall,
    marginTop: 4,
  },
  itemsContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: 12,
  },
  cartItem: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  itemDesc: {
    color: theme.colors.outline,
    ...theme.typography.bodySmall,
    marginTop: 2,
  },
  itemPrice: {
    color: theme.colors.primary,
    ...theme.typography.bodyMedium,
    fontWeight: 'bold',
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityText: {
    color: theme.colors.primary,
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
  },
  deliverySection: {
    padding: theme.spacing.md,
    marginTop: 20,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryTitle: {
    color: theme.colors.secondary,
    ...theme.typography.labelLarge,
    letterSpacing: 2,
  },
  changeAction: {
    color: theme.colors.primary,
    ...theme.typography.labelMedium,
    fontWeight: 'bold',
  },
  selectedAddressCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  addressInfoMain: {
    gap: 4,
  },
  selectedAddressLabel: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  selectedAddressText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySmall,
  },
  addAddressPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addAddressText: {
    color: theme.colors.primary,
    ...theme.typography.bodyMedium,
    fontWeight: '600',
  },
  summarySection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginTop: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMedium,
  },
  summaryValue: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyMedium,
    fontWeight: 'bold',
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  totalValue: {
    color: theme.colors.primary,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: 'white',
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 400,
    maxHeight: '80%',
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  modalTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  modalList: {
    flex: 1,
  },
  modalAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainer,
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalAddressCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 121, 0, 0.05)',
  },
  modalAddressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  staticMap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  modalAddressTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  modalAddressLabel: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  modalAddressStreet: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySmall,
    marginTop: 2,
  },
  modalAddNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    marginTop: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 20,
  },
  modalAddNewText: {
    color: theme.colors.primary,
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: theme.colors.outline,
    ...theme.typography.bodyLarge,
  },
  startRitualBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startRitualText: {
    color: 'white',
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
  },
});
