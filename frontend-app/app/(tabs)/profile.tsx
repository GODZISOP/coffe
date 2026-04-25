import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../src/styles/theme';
import { IconSymbol } from '../../src/components/ui/IconSymbol';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/context/AuthProvider';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (session) {
      fetchProfileAndOrders();
    }
  }, [session]);

  const fetchProfileAndOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch Recent Orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (orderData) setOrders(orderData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("Error signing out", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.identityContainer}>
          <View>
            <Text style={styles.userName}>{profile?.full_name || session?.user.email?.split('@')[0] || 'Artisan'}</Text>
            <Text style={styles.memberStatus}>
              {profile?.updated_at 
                ? `Member since ${new Date(profile.updated_at).getFullYear()}` 
                : 'Ritual member since 2024'}
            </Text>
          </View>

          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4nqF7veH1-w8GVhyLWtfESKCga6lWSsoPs9zoBGO7N__4SZz3C_-cOO2fuBfoY-APBhFr4nN7dut4SWQf0nlPl0TQQUH2LjqPsbyVKZQsyEhpRJXJePAbPW79OUqo2WXEEs1r44amtsXpuHa1VSuxssAc_5Pl6eJg_MJBbnkHP0tiACu2zb6mvIPCrGWnDRchzytrn74LlZCaQmLJ5vlvEp5d8s1SFbTUlhLM1aHYzSBVfVwelXrrPvEp36gqkzXKXK-hecBXQEI' }}
            style={styles.avatar}
          />
        </View>

        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyTop}>
            <View>
              <Text style={styles.brewPointsLabel}>BREW POINTS</Text>
              <Text style={styles.brewPointsValue}>1,240</Text>
            </View>
            <IconSymbol name="star.fill" size={32} color={theme.colors.onPrimary} />
          </View>
          <View style={styles.loyaltyBottom}>
            <Text style={styles.nextRewardText}>Next reward at 1,500 pts</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>Gold Tier</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MY RITUAL</Text>
        <View style={styles.preferencesGrid}>
          <View style={styles.preferenceCard}>
            <IconSymbol name="house.fill" size={24} color={theme.colors.primary} />
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceLabel}>DEFAULT MILK</Text>
              <Text style={styles.preferenceValue}>Oat Milk</Text>
            </View>
          </View>
          <View style={styles.preferenceCard}>
            <IconSymbol name="house.fill" size={24} color={theme.colors.primary} />
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceLabel}>SUGAR LEVEL</Text>
              <Text style={styles.preferenceValue}>Normal</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ORDERS</Text>
          {orders.length > 0 && (
            <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
          )}
        </View>
        
        {orders.length === 0 ? (
          <View style={styles.emptyOrdersContainer}>
            <Text style={styles.emptyOrdersText}>No rituals recorded yet.</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderIconPlaceholder}>
                <IconSymbol name="bolt.fill" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderName}>Ritual #{order.id.slice(0, 8)}</Text>
                <Text style={styles.orderMeta}>
                  {new Date(order.created_at).toLocaleDateString()} • ${order.total_amount.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: order.status === 'completed' ? '#4caf50' : theme.colors.primary }]}>
                <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}
      </View>


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PAYMENT METHODS</Text>
        <View style={styles.listContainer}>
          <TouchableOpacity style={styles.listItem}>
            <IconSymbol name="person.fill" size={24} color={theme.colors.onSurfaceVariant} />
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>•••• 4429</Text>
              <Text style={styles.listSubtitle}>Primary • Expires 08/26</Text>
            </View>
            <IconSymbol name="star.fill" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.listItem, { borderBottomWidth: 0 }]}>
            <IconSymbol name="person.fill" size={24} color={theme.colors.onSurfaceVariant} />
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Apple Pay</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SETTINGS</Text>
        <TouchableOpacity style={styles.settingRow}>
          <IconSymbol name="house.fill" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.settingText}>Notification Settings</Text>
          <IconSymbol name="chevron.right" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <IconSymbol name="house.fill" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.settingText}>Privacy & Security</Text>
          <IconSymbol name="chevron.right" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingRow, { marginTop: theme.spacing.sm }]}
          onPress={handleSignOut}
        >
          <IconSymbol name="person.fill" size={24} color="#ffb4ab" />
          <Text style={[styles.settingText, { color: '#ffb4ab' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
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
  identityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  userName: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
  },
  memberStatus: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelMd,
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  loyaltyCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
    height: 140,
    justifyContent: 'space-between',
  },
  loyaltyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brewPointsLabel: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelSm,
    opacity: 0.8,
  },
  brewPointsValue: {
    color: theme.colors.onPrimary,
    ...theme.typography.headlineLg,
    marginTop: 4,
  },
  loyaltyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nextRewardText: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelMd,
    opacity: 0.9,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelSm,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.secondary,
    ...theme.typography.labelLg,
    marginBottom: theme.spacing.sm,
  },
  viewAllText: {
    color: theme.colors.primary,
    ...theme.typography.labelMd,
  },
  preferencesGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  preferenceCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  preferenceTextContainer: {
    marginTop: theme.spacing.xs,
  },
  preferenceLabel: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelSm,
  },
  preferenceValue: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 31, 29, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.rounded.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  orderIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.rounded.sm,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyOrdersContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: theme.rounded.md,
  },
  emptyOrdersText: {
    color: theme.colors.outline,
    ...theme.typography.bodyMd,
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
  orderImage: {

    width: 60,
    height: 60,
    borderRadius: theme.rounded.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
  orderDetails: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  orderName: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
    fontWeight: '600',
  },
  orderMeta: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelSm,
    marginTop: 4,
  },
  reorderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.rounded.sm,
  },
  reorderText: {
    color: theme.colors.onPrimary,
    ...theme.typography.labelMd,
    fontWeight: 'bold',
  },
  listContainer: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  listTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  listTitle: {
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
  },
  listSubtitle: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelSm,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.md,
    marginBottom: theme.spacing.xs,
  },
  settingText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
  },
});
