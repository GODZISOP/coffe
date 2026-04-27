import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { theme } from '../src/styles/theme';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/context/AuthProvider';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import Skeleton from '../src/components/ui/Skeleton';

const { width, height } = Dimensions.get('window');

// REPLACE THIS WITH YOUR ACTUAL GOOGLE MAPS API KEY
const GOOGLE_MAPS_API_KEY = '';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddressesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [label, setLabel] = useState('Home');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      initializeLocation();
      return () => {};
    }, [])
  );

  const initializeLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to find your ritual spot.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setRegion(newRegion);
      await reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Location Init Error:', error);
    } finally {
      // Premium feel delay
      setTimeout(() => setLoading(false), 800);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (response.length > 0) {
        const item = response[0];
        setAddress(`${item.streetNumber || ''} ${item.street || ''}`.trim() || item.name || '');
        setCity(item.city || item.region || '');
      }
    } catch (error) {
      console.error('Reverse Geocode Error:', error);
    }
  };

  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const handleSave = async () => {
    if (!address) {
      Alert.alert('Error', 'Please select a valid ritual location.');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('addresses')
        .insert({
          user_id: user?.id,
          label,
          address,
          city,
          lat: region.latitude,
          lng: region.longitude,
          notes
        });

      if (error) throw error;

      Alert.alert('Success', 'Ritual location saved.', [
        { text: 'Great', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={180} height={24} />
          <View style={{ width: 40 }} />
        </View>
        <Skeleton height={height * 0.45} />
        <View style={{ padding: 20, gap: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Skeleton width={80} height={40} borderRadius={20} />
            <Skeleton width={80} height={40} borderRadius={20} />
            <Skeleton width={80} height={40} borderRadius={20} />
          </View>
          <Skeleton height={56} borderRadius={16} />
          <Skeleton height={56} borderRadius={16} />
          <Skeleton height={56} borderRadius={28} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Ritual Spot</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        <View style={styles.markerFixed}>
          <IconSymbol name="mappin.circle.fill" size={48} color={theme.colors.primary} />
        </View>

        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search for a location"
            onPress={(data, details = null) => {
              if (details) {
                const newRegion = {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 1000);
              }
            }}
            query={{
              key: GOOGLE_MAPS_API_KEY,
              language: 'en',
            }}
            fetchDetails={true}
            styles={{
              container: { flex: 0 },
              textInput: styles.searchInput,
              listView: styles.searchListView,
            }}
          />
        </View>

        <TouchableOpacity 
          style={styles.myLocationButton} 
          onPress={async () => {
            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
              ...region,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
          }}
        >
          <IconSymbol name="location.fill" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.labelSection}>
          <Text style={styles.sectionLabel}>SAVE AS</Text>
          <View style={styles.chipContainer}>
            {LABELS.map(l => (
              <TouchableOpacity 
                key={l} 
                style={[styles.chip, label === l && styles.chipActive]}
                onPress={() => setLabel(l)}
              >
                <Text style={[styles.chipText, label === l && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.sectionLabel}>STREET ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter street address"
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.sectionLabel}>CITY / AREA</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.sectionLabel}>APARTMENT / FLOOR / NOTES</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. 4th Floor, knock twice"
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE LOCATION</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: height * 0.45,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  searchInput: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
    color: theme.colors.onBackground,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  searchListView: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 12,
    marginTop: 8,
  },
  detailsContainer: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  labelSection: {
    marginBottom: 24,
    marginTop: 8,
  },
  sectionLabel: {
    color: theme.colors.secondary,
    ...theme.typography.labelSmall,
    letterSpacing: 2,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelLarge,
  },
  chipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    color: theme.colors.onBackground,
    ...theme.typography.bodyMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
