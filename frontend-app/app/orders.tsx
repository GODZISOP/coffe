import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/styles/theme';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/context/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton from '../src/components/ui/Skeleton';

export default function OrdersScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (session) {
      fetchAllOrders();
    }
  }, [session]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const orderDate = new Date(item.created_at);
    const formattedDate = orderDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formattedTime = orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    const firstItem = item.items?.[0];
    const itemImg = firstItem?.image || firstItem?.image_url;
    const imageUrl = itemImg?.startsWith('http')
      ? itemImg
      : itemImg 
        ? supabase.storage.from('product_images').getPublicUrl(itemImg).data.publicUrl 
        : null;

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => router.push({ pathname: '/tracking', params: { orderId: item.id } })}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.orderImage} />
        ) : (
          <View style={styles.orderIconPlaceholder}>
            <IconSymbol name="cup.and.saucer.fill" size={24} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.orderDetails}>
          <Text style={styles.orderName}>Ritual #{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderMeta}>
            {formattedDate} • {formattedTime}
          </Text>
          <Text style={styles.orderTotal}>${item.total_amount.toFixed(2)} • {item.items?.length || 0} items</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#4caf50' : theme.colors.primary }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.title}>All Rituals</Text>
      </View>

      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((_, i) => (
            <View key={i} style={styles.orderCard}>
              <Skeleton width={50} height={50} borderRadius={theme.rounded.sm} />
              <View style={[styles.orderDetails, { gap: 8 }]}>
                <Skeleton width="70%" height={20} />
                <Skeleton width="40%" height={12} />
                <Skeleton width="50%" height={14} />
              </View>
              <Skeleton width={60} height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="cart" size={64} color={theme.colors.outline} />
          <Text style={styles.emptyText}>No rituals recorded yet.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.startBtn}>
            <Text style={styles.startText}>START A RITUAL</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineMd,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 31, 29, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  orderIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: theme.rounded.sm,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderImage: {
    width: 50,
    height: 50,
    borderRadius: theme.rounded.sm,
  },
  orderDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  orderName: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
    fontWeight: 'bold',
  },
  orderMeta: {
    color: theme.colors.outline,
    ...theme.typography.labelSm,
    marginTop: 2,
  },
  orderTotal: {
    color: theme.colors.primary,
    ...theme.typography.labelMd,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.outline,
    ...theme.typography.bodyLg,
    marginTop: theme.spacing.md,
  },
  startBtn: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.primary,
  },
  startText: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelLg,
  }
});
