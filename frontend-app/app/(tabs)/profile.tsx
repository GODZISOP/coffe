import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { IconSymbol } from '../../src/components/ui/IconSymbol';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/context/AuthProvider';
import Skeleton from '../../src/components/ui/Skeleton';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');

  // Stats calculation
  const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const ordersThisMonth = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).length;

  useFocusEffect(
    React.useCallback(() => {
      if (session) {
        fetchData();
      } else {
        setLoading(false);
      }
    }, [session])
  );

  const fetchData = async () => {
    try {
      setLoading(!refreshing);
      
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. Fetch Recent Orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false });
      
      if (orderData) setOrders(orderData);

      // 3. Fetch Favorites (Simplified mock or join)
      // For now, let's just get the count
      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id);
      
      setFavorites(Array(favCount || 0).fill({}));

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to leave the ritual?", [
      { text: "Stay", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        try {
          await signOut();
          router.replace('/login');
        } catch (error: any) {
          Alert.alert("Error", error.message);
        }
      }}
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSkeleton}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <Skeleton width={150} height={24} style={{ marginTop: 12 }} />
          <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={{ padding: 20 }}>
          <Skeleton height={100} borderRadius={16} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Skeleton flex={1} height={80} borderRadius={12} />
            <Skeleton flex={1} height={80} borderRadius={12} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Identity Section */}
      <View style={styles.identitySection}>
        <TouchableOpacity 
          style={styles.identityHeader} 
          onPress={() => router.push('/edit-profile')}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' }}
            style={styles.avatar}
          />
          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{profile?.full_name || 'Artisan'}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{profile?.tier || 'Bronze'}</Text>
              </View>
            </View>
            <Text style={styles.handle}>@{profile?.username || session?.user.email?.split('@')[0]}</Text>
            <Text style={styles.tagline} numberOfLines={1}>
              {profile?.tagline || 'Crafting the perfect daily ritual...'}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Stats Section (Horizontal Cards) */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL SPENT</Text>
          <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>MONTHLY ORDERS</Text>
          <Text style={styles.statValue}>{ordersThisMonth}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>FAVORITES</Text>
          <Text style={styles.statValue}>{favorites.length}</Text>
        </View>
      </View>

      {/* Main Content Sections */}
      <View style={styles.content}>
        
        {/* Concierge Section */}
        <SectionHeader title="CONCIERGE" />
        <View style={styles.card}>
          <MenuItem 
            icon="sparkles" 
            title="AI Coffee Assistant" 
            subtitle="Your personal ritual guide"
            onPress={() => router.push('/ai-assistant')}
          />
          <MenuItem 
            icon="bubble.left.and.bubble.right.fill" 
            title="Customer Support" 
            subtitle="Chat with a coffee expert"
            onPress={() => router.push('/support')}
            isLast
          />
        </View>

        {/* Saved Things */}
        <SectionHeader title="SAVED RITUALS" />
        <View style={styles.card}>
          <MenuItem 
            icon="heart.fill" 
            title="Favorite Drinks" 
            subtitle={`${favorites.length} items saved`}
            onPress={() => Alert.alert('Coming Soon', 'Your favorite brew list is being curated.')}
          />
          <MenuItem 
            icon="house.fill" 
            title="Saved Addresses" 
            subtitle="Home, Work"
            onPress={() => router.push('/addresses')}
          />
          <MenuItem 
            icon="creditcard.fill" 
            title="Payment Methods" 
            subtitle="Visa •••• 4429"
            onPress={() => Alert.alert('Coming Soon', 'Secure ritual vault is launching soon.')}
            isLast
          />
        </View>

        {/* Recent Orders */}
        <SectionHeader 
          title="ORDER HISTORY" 
          action="View All" 
          onAction={() => router.push('/orders')} 
        />
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No rituals recorded yet.</Text>
          </View>
        ) : (
          orders.slice(0, 3).map((order, idx) => {
            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const formattedTime = orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            const firstItem = order.items?.[0];
            const itemImg = firstItem?.image || firstItem?.image_url;
            const imageUrl = itemImg?.startsWith('http')
              ? itemImg
              : itemImg 
                ? supabase.storage.from('product_images').getPublicUrl(itemImg).data.publicUrl 
                : null;

            return (
              <TouchableOpacity 
                key={order.id} 
                style={[styles.orderItem, idx === 2 && { borderBottomWidth: 0 }]}
                onPress={() => router.push({ pathname: '/tracking', params: { orderId: order.id } })}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.orderImage} />
                ) : (
                  <View style={styles.orderIcon}>
                    <Text style={{ fontSize: 20 }}>☕</Text>
                  </View>
                )}
                <View style={styles.orderDetails}>
                  <Text style={styles.orderTitle}>Ritual #{order.id.slice(0, 6).toUpperCase()}</Text>
                  <Text style={styles.orderMeta}>{formattedDate} • {formattedTime}</Text>
                  <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                    ${order.total_amount.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.reorderBtn}
                  onPress={() => router.push({ pathname: '/tracking', params: { orderId: order.id } })}
                >
                  <Text style={styles.reorderText}>TRACK</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* Settings & Preferences */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.card}>
          <PreferenceRow 
            label="Dietary" 
            value={profile?.dietary_preference || 'None'} 
            onPress={() => router.push('/edit-profile')}
          />
          <PreferenceRow 
            label="Default Size" 
            value={profile?.default_cup_size || 'Medium'} 
            onPress={() => router.push('/edit-profile')}
          />
          <PreferenceRow 
            label="Language" 
            value={language === 'en' ? 'English' : 'Urdu (Roman)'} 
            onPress={() => setLanguage(l => l === 'en' ? 'ur' : 'en')}
          />
          <PreferenceRow 
            label="Notifications" 
            value="Enabled" 
            onPress={() => Alert.alert('Settings', 'Notification preferences updated.')}
            isLast
          />
        </View>

        {/* Footer Actions */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconSymbol name="person.fill" size={20} color="#ffb4ab" />
          <Text style={styles.signOutButtonText}>Sign Out of Ritual</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>BREW Version 2.4.0 (Artisan Edition)</Text>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Sub-components
function SectionHeader({ title, action, onAction }: any) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MenuItem({ icon, title, subtitle, onPress, isLast }: any) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
    >
      <View style={styles.menuIconContainer}>
        <IconSymbol name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

function PreferenceRow({ label, value, onPress, isLast }: any) {
  return (
    <TouchableOpacity 
      style={[styles.prefRow, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
    >
      <Text style={styles.prefLabel}>{label}</Text>
      <View style={styles.prefValueContainer}>
        <Text style={styles.prefValue}>{value}</Text>
        <IconSymbol name="chevron.right" size={14} color={theme.colors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSkeleton: {
    paddingTop: 80,
    alignItems: 'center',
    paddingBottom: 20,
  },
  identitySection: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 20,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  identityText: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  tierBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  handle: {
    color: theme.colors.primary,
    ...theme.typography.labelMedium,
    marginTop: 2,
  },
  tagline: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySmall,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statValue: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    marginTop: 4,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: theme.colors.secondary,
    ...theme.typography.labelLarge,
    letterSpacing: 1,
  },
  sectionAction: {
    color: theme.colors.primary,
    ...theme.typography.labelMedium,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyLarge,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySmall,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  orderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyMedium,
    fontWeight: 'bold',
  },
  orderMeta: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySmall,
    marginTop: 2,
  },
  reorderBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reorderText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMedium,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  prefLabel: {
    color: theme.colors.onBackground,
    ...theme.typography.bodyMedium,
  },
  prefValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefValue: {
    color: theme.colors.primary,
    ...theme.typography.bodyMedium,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 180, 171, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.2)',
  },
  signOutButtonText: {
    color: '#ffb4ab',
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
  },
  versionText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
});
