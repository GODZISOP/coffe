import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { supabase } from '../../src/services/supabase';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/context/AuthProvider';
import { IconSymbol } from '../../src/components/ui/IconSymbol';
import Skeleton from '../../src/components/ui/Skeleton';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchProducts();
      if (session) {
        fetchActiveOrder();
      } else {
        setLoading(false);
      }
    }, [session])
  );

  async function fetchActiveOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setActiveOrder(data);
    } catch (err) {
      // Ignore if no active order
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchActiveOrder()]);
    setRefreshing(false);
  };

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;

      const blacklist = ['Gold Leaf Latte', 'Silk Road Matcha', 'matcha-001', 'gold-leaf-uuid'];
      const dbProducts = (data || []).filter(p => !blacklist.includes(p.name) && !blacklist.includes(p.id));

      const fallbackFeatured = [
        { id: '023d4a9d-9329-463e-8e55-7aae836c3f5f', title: 'Saffron Pistachio Latte', image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=800' },
        { id: 'rose-001', title: 'Rose Petal Cappuccino', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: 'turkish-001', title: 'Turkish Delight Mocha', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800' }
      ];
      const fallbackAll = [
        { id: '1dd4dc46-87b8-403b-ae9f-731c84ae5cca', name: 'Velvet Flat White', desc: 'House Silk Blend', price: '$6.25', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800' },
        { id: '8e0eca5e-d530-4c52-91c6-188b30846b24', name: 'Obsidian Iced Latte', desc: 'Charcoal Infused', price: '$7.00', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: 'rose-001', name: 'Rose Petal Cappuccino', desc: 'Floral & Creamy', price: '$8.50', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: 'lavender-001', name: 'Lavender Honey Latte', desc: 'Sweet Lavender', price: '$7.75', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800' },
        { id: 'turkish-001', name: 'Turkish Delight Mocha', desc: 'Rose & Cocoa', price: '$9.00', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800' },
        { id: 'hibiscus-001', name: 'Iced Hibiscus Tea', desc: 'Floral Refreshment', price: '$6.50', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800' },
        { id: 'food-001', name: 'Artisan Croissant', desc: 'Buttery & Flaky', price: '$4.50', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' },
        { id: 'food-002', name: 'Blueberry Ritual Muffin', desc: 'Fresh Berries', price: '$3.75', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800' },
        { id: 'tea-001', name: 'Saffron Infused Tea', desc: 'Premium Blend', price: '$6.00', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800' },
      ];

      const uniqueFeatured = [...dbProducts.filter(p => p.is_featured), ...fallbackFeatured.filter(f => !dbProducts.some(p => p.id === f.id))].map(p => {
        const fb = fallbackFeatured.find(f => f.id === p.id);
        return { ...p, image: p.image || p.image_url || fb?.image };
      });
      const uniqueAll = [...dbProducts, ...fallbackAll.filter(f => !dbProducts.some(p => p.id === f.id))].map(p => {
        const fb = fallbackAll.find(f => f.id === p.id);
        return { ...p, image: p.image || p.image_url || fb?.image };
      });

      setFeaturedProducts(uniqueFeatured.slice(0, 5));
      setAllProducts(uniqueAll);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(`${error.message || 'Network request failed'}`);
    } finally {
      setLoading(false);
    }
  }


  if (loading && !refreshing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Skeleton width={120} height={32} />
            <Skeleton width={200} height={24} style={{ marginTop: 8 }} />
          </View>
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>

        <View style={{ padding: theme.spacing.md }}>
          <Skeleton height={80} borderRadius={theme.rounded.lg} />
        </View>

        <View style={styles.featuredContainer}>
          <Text style={styles.sectionTitle}>FEATURED RITUALS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {[1, 2, 3].map((_, i) => (
              <View key={i} style={[styles.card, { backgroundColor: 'transparent' }]}>
                <Skeleton height={200} width={200} borderRadius={theme.rounded.lg} />
                <Skeleton height={20} width={150} style={{ marginTop: 10, marginLeft: 5 }} />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.curatedSection}>
          <Text style={styles.sectionTitle}>CURATED SELECTION</Text>
          <View style={{ paddingHorizontal: theme.spacing.md }}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={styles.skeletonListItem}>
                <Skeleton width={60} height={60} borderRadius={theme.rounded.sm} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Skeleton width="80%" height={18} />
                  <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
                  <Skeleton width="30%" height={18} style={{ marginTop: 8 }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>BREW</Text>
          <Text style={styles.subtitle}>Good Morning, {session?.user.email?.split('@')[0] || 'Artisan'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/support')}
            style={styles.headerIconButton}
          >
            <IconSymbol name="bubble.left.and.bubble.right.fill" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/ai-assistant')}
            style={styles.headerIconButton}
          >
            <IconSymbol name="sparkles" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderBanner}
          onPress={() => router.push('/tracking')}
        >
          <View style={styles.activeOrderIcon}>
            <IconSymbol name="bolt.fill" size={24} color={theme.colors.onPrimary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.activeOrderTitle}>Active Ritual Progress</Text>
            <Text style={styles.activeOrderSubtitle}>Status: {activeOrder.status.toUpperCase()}</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.aiBanner}
        onPress={() => router.push('/ai-assistant')}
      >
        <View style={styles.aiBannerContent}>
          <Text style={styles.aiBannerTitle}>Order with AI</Text>
          <Text style={styles.aiBannerSubtitle}>English & Urdu supported</Text>
        </View>
        <View style={styles.aiIconContainer}>
          <Text style={{ fontSize: 24 }}>☕</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>FEATURED RITUALS</Text>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Network connectivity limited. Rituals are restricted.</Text>
            <TouchableOpacity onPress={fetchProducts} style={styles.retryBtn}>
              <Text style={styles.retryText}>RETRY CONNECTION</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {featuredProducts.map((item, index) => (
              <TouchableOpacity key={item.id || index} style={styles.card} onPress={() => router.push({ pathname: '/drink', params: { id: item.id } })}>
                <Image source={{ uri: item.image || item.image_url }} style={styles.cardImagePlaceholder} />
                <Text style={styles.cardTitle}>{item.title || item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.curatedSection}>
        <Text style={styles.sectionTitle}>CURATED SELECTION</Text>
        {allProducts.map((item, index) => (
          <TouchableOpacity key={item.id || index} style={styles.listItem} onPress={() => router.push({ pathname: '/drink', params: { id: item.id } })}>
            <Image source={{ uri: item.image || item.image_url }} style={styles.listImagePlaceholder} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{item.name}</Text>
              <Text style={styles.listItemDesc}>{item.desc || item.description}</Text>
              <Text style={styles.listItemPrice}>{item.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeOrderBanner: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.rounded.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeOrderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOrderTitle: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelLg,
    fontWeight: 'bold',
  },
  activeOrderSubtitle: {
    color: theme.colors.onPrimary,
    ...theme.typography.bodySm,
    opacity: 0.9,
  },
  aiBanner: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    color: 'white',
    ...theme.typography.headlineMd,
  },
  aiBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    ...theme.typography.bodySm,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.primaryContainer,
  },
  title: {
    color: theme.colors.primary,
    ...theme.typography.headlineMd,
  },
  subtitle: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineLg,
    marginTop: theme.spacing.xs,
  },
  featuredContainer: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineMd,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  featuredScroll: {
    paddingLeft: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    marginRight: theme.spacing.sm,
    width: 200,
    overflow: 'hidden',
  },
  cardImagePlaceholder: {
    height: 200,
    backgroundColor: theme.colors.espresso,
  },
  cardTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyMd,
    padding: theme.spacing.sm,
  },
  curatedSection: {
    marginTop: theme.spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
  },
  listImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.rounded.sm,
    backgroundColor: theme.colors.espresso,
  },
  listItemContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  listItemTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyMd,
  },
  listItemDesc: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySm,
  },
  listItemPrice: {
    color: theme.colors.primary,
    ...theme.typography.bodyMd,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 180, 171, 0.05)',
    borderRadius: theme.rounded.md,
    marginVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.2)',
  },
  errorText: {
    color: '#ffb4ab',
    ...theme.typography.bodyMd,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.rounded.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  retryText: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
  },
});
