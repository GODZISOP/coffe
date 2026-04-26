import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { theme } from '../../src/styles/theme';
import { supabase } from '../../src/services/supabase';
import { useCart } from '../../src/context/CartProvider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton from '../../src/components/ui/Skeleton';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - theme.spacing.md * 3) / 2;

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Bakery', 'Specialty'];

export default function MenuScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchProducts();
    }, [])
  );

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;

      const blacklist = ['Gold Leaf Latte', 'Silk Road Matcha', 'matcha-001', 'gold-leaf-uuid'];
      const dbProducts = (data || []).filter(p => !blacklist.includes(p.name) && !blacklist.includes(p.id));

      const fallbackData = [
        { id: '023d4a9d-9329-463e-8e55-7aae836c3f5f', name: 'Saffron Pistachio Latte', category: 'Specialty', price: 12.50, description: 'Saffron infused milk with toasted pistachio.', image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=800' },
        { id: '5b223f6d-0b4f-4e77-817a-9a4e65ec1100', name: 'Aged Barrel Cold Brew', category: 'Coffee', price: 8.00, description: 'Bourbon barrel aged beans.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: '1dd4dc46-87b8-403b-ae9f-731c84ae5cca', name: 'Velvet Flat White', category: 'Coffee', price: 6.25, description: 'Smooth, creamy house blend.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800' },
        { id: '8e0eca5e-d530-4c52-91c6-188b30846b24', name: 'Obsidian Iced Latte', category: 'Specialty', price: 7.00, description: 'Activated charcoal latte.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: 'mocha-001', name: 'Midnight Mocha', category: 'Coffee', price: 7.50, description: 'Dark chocolate & espresso.', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800' },
        { id: 'rose-001', name: 'Rose Petal Cappuccino', category: 'Specialty', price: 8.50, description: 'Infused with organic rose water.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: 'lavender-001', name: 'Lavender Honey Latte', category: 'Specialty', price: 7.75, description: 'Lavender syrup and wild honey.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800' },
        { id: 'vanilla-001', name: 'Smoked Vanilla Latte', category: 'Coffee', price: 8.25, description: 'Smoked vanilla bean extract.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
        { id: 'coconut-001', name: 'Coconut Cloud Macchiato', category: 'Coffee', price: 7.50, description: 'Creamy coconut foam.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800' },
        { id: 'hibiscus-001', name: 'Iced Hibiscus Tea', category: 'Tea', price: 6.50, description: 'Refreshing floral cold tea.', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800' },
        { id: 'tea-001', name: 'Saffron Infused Tea', category: 'Tea', price: 6.00, description: 'Premium black tea with saffron.', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800' },
        { id: 'food-001', name: 'Artisan Croissant', category: 'Bakery', price: 4.50, description: 'Buttery, flaky french pastry.', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' },
        { id: 'food-002', name: 'Blueberry Ritual Muffin', category: 'Bakery', price: 3.75, description: 'Fresh berries & honey glaze.', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800' },
      ];

      const combined = [...dbProducts, ...fallbackData.filter(f => !dbProducts.some(p => p.id === f.id))];

      setProducts(combined);
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      options: 'Medium',
      image: item.image || item.image_url
    });
    Alert.alert('Ritual Added', `${item.name} is now in your selection.`);
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image || item.image_url }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDesc} numberOfLines={1}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={100} height={32} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
        <View style={styles.searchContainer}>
          <Skeleton height={48} borderRadius={theme.rounded.md} />
        </View>
        <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: 20 }}>
          <Skeleton width="100%" height={40} borderRadius={20} />
        </View>
        <View style={styles.productListSkeleton}>
          {[1, 2, 3, 4, 5, 6].map((_, i) => (
            <View key={i} style={styles.productCardSkeleton}>
              <Skeleton width="100%" height={COLUMN_WIDTH} borderRadius={theme.rounded.lg} />
              <View style={{ padding: 8 }}>
                <Skeleton width="80%" height={16} />
                <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Skeleton width="40%" height={18} />
                  <Skeleton width={32} height={32} borderRadius={16} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity
          style={styles.cartIcon}
          onPress={() => Alert.alert('Ritual Notifications', 'You will be notified when your artisanal brew is ready.')}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find your ritual..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesWrapper}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory === item && styles.categoryItemSelected
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={item => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No items found in this ritual.</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    color: theme.colors.onBackground,
    ...theme.typography.headlineLg,
  },
  cartIcon: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: theme.colors.onBackground,
    ...theme.typography.bodyMd,
  },
  categoriesWrapper: {
    marginBottom: theme.spacing.md,
  },
  categoryList: {
    paddingHorizontal: theme.spacing.md,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: theme.rounded.full,
    marginRight: 10,
    backgroundColor: theme.colors.surfaceContainer,
  },
  categoryItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelLg,
  },
  categoryTextSelected: {
    color: 'white',
  },
  productList: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: COLUMN_WIDTH,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: COLUMN_WIDTH,
    backgroundColor: theme.colors.surfaceVariant,
  },
  productInfo: {
    padding: theme.spacing.sm,
  },
  productName: {
    color: theme.colors.onBackground,
    ...theme.typography.titleMd,
  },
  productDesc: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodySm,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPrice: {
    color: theme.colors.primary,
    ...theme.typography.titleLg,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMd,
  },
  productListSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
  },
  productCardSkeleton: {
    width: COLUMN_WIDTH,
    marginBottom: theme.spacing.md,
  },
});
