import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { supabase } from '../../src/services/supabase';
import { useState, useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      
      if (data) {
        setFeaturedProducts(data.filter(p => p.is_featured));
        setAllProducts(data);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(`${error.message || 'Network request failed'} (${process.env.EXPO_PUBLIC_SUPABASE_URL || 'URL Missing'})`);
      // Fallback to static data if table doesn't exist yet
      setFeaturedProducts([
        { id: 'f1', title: 'Gold Leaf Latte', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbRqlH80YDaT0UvW-gD4fVOxqx_Mtq1-hwKSjKwNpEYe-gXdteGokBNwXYwGnQYlMqysnLqWBS5TwiyQg7QOjsFKu69oaniXp19don7mANNxPA6wCeFQh7dCaQM4ZCgG8LaITsmgLn_t8Z6IpdGe4g-s-4pAyPBcMBAPMLXik21pfit1WcxM6HDq5Jx6ZSWYKtll3OljCFrZFjzWtfMjSZ3CzgD49LzUzyLP3B9Vs5HEUYLpHjq1SJ9lj3d_JYVFKwf-CrJXGgXGY' },
        { id: 'f2', title: 'Aged Barrel Cold Brew', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRdTKfUdNKHb6cK8wJivcMJPj0tkwG9TOVRIM02Q4GyqyImGSrhJvBpsa4PSt5y8mt5Sfn5YtYstFtf9pNNDLs2WwkGLlgpukzBXcmyrDhojHmFDHRgMQZxEZ1lrtZhL3ThmAwTI3lF0FCkgDJucdkBmselakoKtv9c2LAUwDL9xDoG7aQBsecSc1N0LUolODd9uw6Fzi5-Xfw_znmntRpVY53N7Uned2vA0pMg-T9kvBHgla-xcH81ZcQihghiVcK3oVThNNe5M' }
      ]);
      setAllProducts([
        { id: 'a1', name: 'Velvet Flat White', desc: 'House Silk Blend', price: '$6.25', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf8AAVylwx2GU6LAnF4Ns3eGM1CN1UZlDdSIsYWiohIYFbX5InejGVeooo_tQpY4X6QaZ9hpo-WNBipPtPSBp-noJAqKGmHD7WM-eT0bS1oIbMPCggvUrcYqva0FO7ClKgVifZbudrnoKWYA0aFk3c6nHtZdPK9tvJLvseTbikckm0xa_jPzb6glnjO4Bhelv60bZq3hyW_hf97tmqIiVqmwZo9cqCHtK_RbPvuPL2ixxJP7PRv_8gb8rPhQuBc3lzwKZOY24Ertg' },
        { id: 'a2', name: 'Obsidian Iced Latte', desc: 'Charcoal Infused', price: '$7.00', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsJPZx0UVpwVSMN9QFRAXrfd6vceuHjVnGAU29paeho3L6MOkz5R3kbyk37aBR5-wZet8cFAmknqVEUNCXxt7-V5DlhkXhCs1pnf4n6nIpUz_PHiU8a6dOoj8tEz3IxRHDgPaesQF1O2VfQ3dBnQfoOlFfx4W9fPNlrD_AcaNzg52x0O55cq_RwXb7HDo_hq5ny9OaIyPAKSwaua799wTJL0PkDrkqS3pXPvAGFnL86eKVKLa-T_dBEN566uzzUuwXKOUdJe8UhUI' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>BREW</Text>
          <Text style={styles.subtitle}>Good Morning, Alex</Text>
        </View>
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX70ovQG_KVPs2Fv6_OiIAMmEdvqGUgPZt6sEdlDsqdSKy85jkItmmScRwTDIgES16vyVuD3lyk7dmMF2SXCZ40GgKa90ctMYjLH7hYGWusRPUUYGKpNM768ecqxDNMPfpZOsjAf9YkmUb3ucK7rjNNj9qsOsbpby4p95z21mIsamJB_QiYjnvA8fFV4rlzAq2Tyedip_Nuj-YosLGyYUdibdG25k0RuzUMhQC7AggvC-jzjjeKdyVECCKypbG-l1uVn8zDWKFtDI' }} 
          style={styles.avatar} 
        />
      </View>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>FEATURED RITUALS</Text>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : error ? (
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
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          allProducts.map((item, index) => (
            <TouchableOpacity key={item.id || index} style={styles.listItem} onPress={() => router.push({ pathname: '/drink', params: { id: item.id } })}>
              <Image source={{ uri: item.image || item.image_url }} style={styles.listImagePlaceholder} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemDesc}>{item.desc || item.description}</Text>
                <Text style={styles.listItemPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  section: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineMd,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  horizontalScroll: {
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
});
