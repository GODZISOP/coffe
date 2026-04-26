import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../src/styles/theme';
import { supabase } from '../src/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Sign In Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });


    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (data.session) {
      Alert.alert('Welcome!', 'Your account has been created and you are now signed in.');
    } else {
      Alert.alert('Verification Required', 'Please check your email to confirm your account.');
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>BREW</Text>
          <Text style={styles.brandSubtitle}>PREMIUM COFFEE EXPERIENCES</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.header}>{isSignUp ? 'Join the Ritual' : 'Enter the Ritual'}</Text>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => setFullName(text)}
                value={fullName}
                placeholder="Julian Thorne"
                placeholderTextColor={theme.colors.outline}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="email@address.com"
              placeholderTextColor={theme.colors.outline}
              autoCapitalize={'none'}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.outline}
              autoCapitalize={'none'}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
            </Text>
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already a member?' : 'New to BREW?'}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleLink}>
                {isSignUp ? ' Sign In' : ' Join Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 70,
  },
  brandTitle: {
    fontFamily: 'Noto Serif',
    fontSize: 49,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 8,
  },
  brandSubtitle: {
    fontFamily: 'Manrope',
    fontSize: 12,
    color: theme.colors.secondary,
    letterSpacing: 4,
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.xl,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    color: theme.colors.onSurface,
    ...theme.typography.headlineMd,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.labelSm,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    color: theme.colors.onSurface,
    height: 56,
    borderRadius: theme.rounded.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    ...theme.typography.bodyLg,
  },
  button: {
    backgroundColor: theme.colors.primaryContainer,
    height: 56,
    borderRadius: theme.rounded.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.onPrimaryContainer,
    ...theme.typography.labelLg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  toggleText: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMd,
  },
  toggleLink: {
    color: theme.colors.primary,
    ...theme.typography.bodyMd,
    fontWeight: 'bold',
  },
});
