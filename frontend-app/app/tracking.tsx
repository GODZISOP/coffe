import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../src/styles/theme';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/context/AuthProvider';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { session } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default store location
  const storeRegion = {
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    if (session) {
      fetchOrderData();
      
      const subscription = supabase
        .channel('order-updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${session.user.id}` 
        }, (payload) => {
          // If we are tracking a specific order, only update if it matches
          if (!orderId || payload.new.id === orderId) {
            setOrder(payload.new);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [session, orderId]);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const fetchOrderData = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id);
        
      if (orderId) {
        query = query.eq('id', orderId).single();
      } else {
        query = query.order('created_at', { ascending: false }).limit(1).single();
      }

      const { data } = await query;
      
      if (data) setOrder(data);
    } catch (error) {
      console.error('Error fetching tracking order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.center]}>
        <IconSymbol name="cup.and.saucer.fill" size={64} color={theme.colors.outline} />
        <Text style={styles.noOrderTitle}>No Ritual in Progress</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.shopButtonText}>START A RITUAL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={storeRegion}
          customMapStyle={mapStyle}
        >
          <Marker
            coordinate={{ latitude: storeRegion.latitude, longitude: storeRegion.longitude }}
            title="BREW Central"
            description="Your ritual is being crafted here"
          >
            <View style={styles.markerContainer}>
              <IconSymbol name="cup.and.saucer.fill" size={20} color="white" />
            </View>
          </Marker>
        </MapView>
        
        <View style={styles.mapOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.detailsContainer} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp} style={styles.statusHeader}>
          <View>
            <Text style={styles.orderLabel}>Order #{order.id.slice(0, 4).toUpperCase()}</Text>
            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>12 min</Text>
          </View>
        </Animated.View>

        <View style={styles.timeline}>
          {[
            { title: 'Order Received', sub: 'The ritual has begun', icon: 'checkmark.circle.fill' },
            { title: 'Preparing', sub: 'Artisan crafting in progress', icon: 'flame.fill' },
            { title: 'Ready', sub: 'Your brew awaits its master', icon: 'cup.and.saucer.fill' }
          ].map((step, idx) => (
            <Animated.View 
              entering={FadeInDown.delay(idx * 100)} 
              key={idx} 
              style={[styles.stepItem, currentStep < idx + 1 && styles.stepDimmed]}
            >
              <View style={styles.stepIconContainer}>
                <View style={[styles.stepLine, idx === 0 && { top: '50%' }, idx === 2 && { height: '50%' }]} />
                <View style={[styles.stepDot, currentStep >= idx + 1 && styles.stepDotActive]}>
                  <IconSymbol name={step.icon as any} size={14} color={currentStep >= idx + 1 ? "white" : "rgba(255,255,255,0.2)"} />
                </View>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= idx + 1 && styles.stepTitleActive]}>{step.title}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={styles.itemSection}>
          <Text style={styles.sectionLabel}>YOUR SELECTION</Text>
          {order.items.map((item: any, idx: number) => {
            const itemImg = item.image || item.image_url;
            const imageUrl = itemImg?.startsWith('http') 
              ? itemImg 
              : itemImg 
                ? supabase.storage.from('product_images').getPublicUrl(itemImg).data.publicUrl 
                : undefined;
            return (
              <Animated.View entering={FadeInUp.delay(idx * 50)} key={idx} style={styles.itemRow}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                  <Text style={styles.itemOptions}>{item.options || 'Standard Brew'}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price || 5.5).toFixed(2)}</Text>
              </Animated.View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Need assistance with your ritual?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161311',
  },
  mapContainer: {
    height: 350,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    padding: 8,
    backgroundColor: '#D4AF37',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#161311',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  orderLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    letterSpacing: 2,
  },
  statusText: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  timeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  timeText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  timeline: {
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    height: 70,
  },
  stepDimmed: {
    opacity: 0.3,
  },
  stepIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  stepLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#231f1d',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepDotActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  stepContent: {
    marginLeft: 16,
    flex: 1,
  },
  stepTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitleActive: {
    color: 'white',
  },
  stepSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    marginTop: 2,
  },
  itemSection: {
    backgroundColor: '#1e1b19',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemOptions: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  helpButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  helpButtonText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '500',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noOrderTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  shopButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 30,
  },
  shopButtonText: {
    color: '#161311',
    fontWeight: 'bold',
  },
});
