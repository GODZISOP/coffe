import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { theme } from '../src/styles/theme';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/context/AuthProvider';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import Skeleton from '../src/components/ui/Skeleton';

const { width } = Dimensions.get('window');

const DIETARY_OPTIONS = ['None', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Keto'];
const CUP_SIZES = ['Small', 'Medium', 'Large'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [tagline, setTagline] = useState('');
  const [dietary, setDietary] = useState('None');
  const [cupSize, setCupSize] = useState('Medium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      if (session) {
        fetchProfile();
      }
      // Ensure skeleton is visible for a moment for that premium feel
      const timer = setTimeout(() => {
        // We'll let fetchProfile handle the actual setLoading(false)
      }, 800);
      return () => clearTimeout(timer);
    }, [session])
  );

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, tagline, dietary_preference, default_cup_size')
        .eq('id', session?.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setTagline(data.tagline || '');
        setDietary(data.dietary_preference || 'None');
        setCupSize(data.default_cup_size || 'Medium');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      // Small delay to ensure smooth transition from skeleton
      setTimeout(() => setLoading(false), 500);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session?.user.id,
          full_name: fullName.trim(),
          username: username.trim(),
          tagline: tagline.trim(),
          dietary_preference: dietary,
          default_cup_size: cupSize,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Your ritual preferences have been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={120} height={24} />
          <Skeleton width={40} height={20} />
        </View>
        <View style={styles.avatarSection}>
          <Skeleton width={90} height={90} borderRadius={45} />
          <Skeleton width={150} height={16} style={{ marginTop: 12 }} />
        </View>
        <View style={{ padding: 20, gap: 20 }}>
          <View>
            <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
            <Skeleton height={50} borderRadius={12} />
          </View>
          <View>
            <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
            <Skeleton height={50} borderRadius={12} />
          </View>
          <View>
            <Skeleton width={150} height={12} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Skeleton width={80} height={36} borderRadius={18} />
              <Skeleton width={80} height={36} borderRadius={18} />
              <Skeleton width={80} height={36} borderRadius={18} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <Text style={styles.saveActionText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editBadge}>
              <IconSymbol name="camera.fill" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        <View style={styles.form}>
          <SectionTitle title="IDENTITY" />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Display Name"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <View style={styles.usernameInputWrapper}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="username"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BIO / TAGLINE</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={tagline}
              onChangeText={setTagline}
              placeholder="Your coffee mantra"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
            />
          </View>

          <SectionTitle title="RITUAL PREFERENCES" />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DIETARY PREFERENCE</Text>
            <View style={styles.chipContainer}>
              {DIETARY_OPTIONS.map(opt => (
                <TouchableOpacity 
                  key={opt} 
                  style={[styles.chip, dietary === opt && styles.chipActive]}
                  onPress={() => setDietary(opt)}
                >
                  <Text style={[styles.chipText, dietary === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DEFAULT CUP SIZE</Text>
            <View style={styles.chipContainer}>
              {CUP_SIZES.map(opt => (
                <TouchableOpacity 
                  key={opt} 
                  style={[styles.chip, cupSize === opt && styles.chipActive]}
                  onPress={() => setCupSize(opt)}
                >
                  <Text style={[styles.chipText, cupSize === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <SectionTitle title="ACCOUNT" />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={session?.user.email}
              editable={false}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={styles.formSectionTitle}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
  saveActionText: {
    color: theme.colors.primary,
    ...theme.typography.labelLg,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  changePhotoText: {
    color: theme.colors.primary,
    ...theme.typography.labelMedium,
    marginTop: 8,
  },
  form: {
    padding: theme.spacing.md,
    gap: 24,
  },
  formSectionTitle: {
    color: theme.colors.secondary,
    ...theme.typography.labelMedium,
    letterSpacing: 2,
    marginTop: 12,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    padding: 14,
    color: theme.colors.onBackground,
    ...theme.typography.bodyMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSymbol: {
    color: theme.colors.onSurfaceVariant,
    backgroundColor: theme.colors.surfaceContainerHigh,
    padding: 14,
    height: '100%',
    textAlignVertical: 'center',
    borderTopLeftRadius: theme.rounded.md,
    borderBottomLeftRadius: theme.rounded.md,
    ...theme.typography.bodyMedium,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    ...theme.typography.labelMedium,
  },
  chipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledInput: {
    opacity: 0.4,
    backgroundColor: 'transparent',
  },
});
