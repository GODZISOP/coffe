import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { theme } from '../src/styles/theme';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/context/AuthProvider';
import { ActivityIndicator } from 'react-native';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (session) {
      fetchLatestOrder();
      
      // Subscribe to realtime updates for this user's orders
      const subscription = supabase
        .channel('order-updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${session.user.id}` 
        }, (payload) => {
          setOrder(payload.new);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [session]);

  const fetchLatestOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setOrder(data);
    } catch (error) {
      console.error('Error fetching tracking order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Text style={[styles.headerTitle, { textAlign: 'center' }]}>No Active Rituals</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ marginTop: 20 }}>
          <Text style={styles.actionText}>START A NEW RITUAL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusStep = () => {
    switch (order.status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 3;
      default: return 1;
    }
  };

  const currentStep = getStatusStep();


  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BREW</Text>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyMxhMUVJDvpvcI0f4kWG00I6VwQhm52R7E3Yz-EdiAFehJmRdKWcFP4xw8r8wF1hdvXoNFw6wjM0glKIGkOvmDBbdAA5iYAgVNFimgJ85v2pC3q39E1PuMvnCG0iqvLmI5odUcBL2oNYE9OofYGDce7NSAL6dhhmzWGKxcvkhl4kmHeAxVFcldf6DYTDhj6LYogtjl5qzlY1HTqfCoQ4Hx2X445JX3g1YJMoFbFOWo4VvTJZRY7HIk5jpfVDG12mZilnxcxvdSKI' }}
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Hero Status Section */}
      <View style={styles.statusSection}>
        <Text style={styles.orderNumber}>CURRENT ORDER #{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeTitle}>
            {order.status === 'pending' ? 'Queued' : 
             order.status === 'preparing' ? '8 Minutes' : 
             order.status === 'ready' ? 'READY' : 'COLLECTED'}
          </Text>
          <Text style={styles.timeSubtitle}>
            {order.status === 'ready' ? 'Grab your brew at the counter' : 'Estimated until collection'}
          </Text>
        </View>
      </View>


      {/* Progress Stepper */}
      <View style={styles.stepperCard}>
        <View style={styles.verticalLine}></View>
        <View style={[styles.verticalLineActive, { height: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }]}></View>

        {/* Step 1 */}
        <View style={styles.stepRow}>
          <View style={currentStep >= 1 ? styles.stepIconCompleted : styles.stepIconUpcoming}>
            <IconSymbol name="star.fill" size={20} color={currentStep >= 1 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, currentStep >= 1 && { color: theme.colors.primary }]}>Order Placed</Text>
            <Text style={styles.stepSubtitle}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.stepRow}>
          <View style={currentStep >= 2 ? styles.stepIconCompleted : currentStep === 1 ? styles.stepIconActive : styles.stepIconUpcoming}>
            <IconSymbol name="star.fill" size={20} color={currentStep >= 2 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
          </View>
          <View style={[styles.stepTextContainer, currentStep < 1 && { opacity: 0.5 }]}>
            <Text style={[styles.stepTitle, currentStep === 2 && { color: theme.colors.primary }]}>Being Prepared</Text>
            <Text style={styles.stepSubtitle}>Your barista is crafting your brew</Text>
          </View>
        </View>

        {/* Step 3 */}
        <View style={[styles.stepRow, { marginBottom: 0 }]}>
          <View style={currentStep >= 3 ? styles.stepIconCompleted : styles.stepIconUpcoming}>
            <IconSymbol name="star.fill" size={20} color={currentStep >= 3 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
          </View>
          <View style={[styles.stepTextContainer, currentStep < 3 && { opacity: 0.5 }]}>
            <Text style={[styles.stepTitle, currentStep === 3 && { color: theme.colors.primary }]}>Ready for Pickup</Text>
            <Text style={styles.stepSubtitle}>Await the final ping</Text>
          </View>
        </View>
      </View>


      {/* Map Preview Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Store Location</Text>
          <TouchableOpacity>
            <Text style={styles.actionText}>GET DIRECTIONS</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mapContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtEE68c95JmDIH1ttzvepQUiygRFACL8ekfuqVty4NS5sbRDMu6v2dCgYxsqb9glpl2p1vwCx3sifYlVgunTRhmv-mJMaPTxsYCVwLOIpbNil1jYmNzjKSBPD0zVXXN6k52Wqd19AiatL1EoPM9SllV0IDfPn_RSWXIhKuqPgIKAx7wPhqvKRITeZC5QNUDKvXqq991b_KO0s2BUTrukxafLDgxHNBKFbVuyp8aRFJpqMjCi1EGFVrRuSm86G6kVAhj5Ftw2R96Q4' }}
            style={styles.mapImage}
          />
          <View style={styles.mapPinContainer}>
            <IconSymbol name="star.fill" size={40} color={theme.colors.primary} />
          </View>
          <View style={styles.storeInfoOverlay}>
            <View style={styles.storeIconContainer}>
              <IconSymbol name="star.fill" size={24} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.storeName}>BREW Central Square</Text>
              <Text style={styles.storeAddress}>42 Barista Ave, Downtown Metro</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Order Summary Brief */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Order Details</Text>
            {order.items?.map((item: any, idx: number) => (
              <View key={idx} style={{ marginTop: 4 }}>
                <Text style={styles.summaryItem}>{item.quantity}x {item.name}</Text>
                <Text style={styles.summaryOptions}>{item.options}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.summaryPrice}>${order.total_amount.toFixed(2)}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  orderNumber: {
    color: theme.colors.secondary,
    ...theme.typography.labelLg,
    letterSpacing: 2,
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  timeTitle: {
    color: theme.colors.primary,
    ...theme.typography.headlineXl,
  },
  timeSubtitle: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyLg,
    marginTop: 4,
  },
  stepperCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  verticalLine: {
    position: 'absolute',
    left: 43,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: theme.colors.secondaryContainer,
  },
  verticalLineActive: {
    position: 'absolute',
    left: 43,
    top: 40,
    height: '50%',
    width: 2,
    backgroundColor: theme.colors.primary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    zIndex: 2,
  },
  stepIconCompleted: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryContainer,
  },
  stepIconUpcoming: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  stepTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  stepTitle: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
    fontWeight: 'bold',
  },
  stepSubtitle: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySm,
    marginTop: 2,
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
  },
  actionText: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
  },
  mapContainer: {
    height: 250,
    borderRadius: theme.rounded.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapPinContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  storeInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(22, 19, 17, 0.9)',
    padding: theme.spacing.sm,
    borderRadius: theme.rounded.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  storeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  storeName: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
    fontWeight: 'bold',
  },
  storeAddress: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelSm,
    marginTop: 2,
  },
  summaryCard: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
    fontWeight: 'bold',
  },
  summaryItem: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
    marginTop: 4,
  },
  summaryOptions: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySm,
    marginTop: 2,
  },
  summaryPrice: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
  },
});
