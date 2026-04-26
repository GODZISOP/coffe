import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { theme } from '../src/styles/theme';
import { processChat, AIResponse, OrderItem, transcribeAudio } from '../src/services/aiOrderService';
import { useCart } from '../src/context/CartProvider';
import { supabase } from '../src/services/supabase';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring
} from 'react-native-reanimated';
import Skeleton from '../src/components/ui/Skeleton';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  orderPreview?: OrderItem[];
  status?: string;
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Assalam-o-Alaikum! Welcome to BREW. I can help you order your favorite ritual. Main apki kya madad kar sakta hoon?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Use Ref for recording to avoid state race conditions
  const recordingRef = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // WhatsApp-style animations
  const micScale = useSharedValue(1);
  const redDotOpacity = useSharedValue(1);
  const waveHeights = [useSharedValue(5), useSharedValue(15), useSharedValue(10), useSharedValue(20), useSharedValue(8)];

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const redDotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: redDotOpacity.value,
  }));

  useFocusEffect(
    React.useCallback(() => {
      setInitialLoading(true);
      setTimeout(() => setInitialLoading(false), 800);
      
      Speech.speak('Assalam-o-Alaikum! Welcome to BREW. Main apki kya madad kar sakta hoon?', { language: 'ur-PK' });
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        forceCleanup();
      };
    }, [])
  );

  const forceCleanup = async () => {
    if (recordingRef.current) {
      try {
        console.log('[Audio] Force cleaning up recording...');
        const status = await recordingRef.current.getStatusAsync();
        if (status.canRecord || status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        }
      } catch (e) {
        console.warn('[Audio] Cleanup warning:', e);
      } finally {
        recordingRef.current = null;
        setIsRecording(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      // 1. Extreme Cleanup
      await forceCleanup();
      
      // 2. Request Permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable microphone access to use voice ordering.');
        return;
      }

      // 3. Configure Audio Mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 4. Create and Prepare Recording
      console.log('[Audio] Creating new recording object...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording;
      setIsRecording(true);
      setRecordingTime(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 5. Start UI Timer & Animations
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      micScale.value = withSpring(1.2);
      redDotOpacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true);
      
      waveHeights.forEach((h, i) => {
        h.value = withRepeat(
          withSequence(
            withTiming(15 + Math.random() * 20, { duration: 300 + i * 50 }),
            withTiming(5 + Math.random() * 10, { duration: 300 + i * 50 })
          ),
          -1,
          true
        );
      });

      console.log('[Audio] Recording started successfully');
    } catch (err) {
      console.error('[Audio] Failed to start recording:', err);
      await forceCleanup();
      // Only alert if it's not a race condition we can recover from
      if (!isRecording) {
        Alert.alert('Audio Error', 'Could not initialize recording ritual. Please try again.');
      }
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      console.log('[Audio] Stopping recording...');
      const status = await recordingRef.current.getStatusAsync();
      if (status.isRecording) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        
        resetAnimations();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (uri) {
          handleVoiceInput(uri);
        }
      }
    } catch (err) {
      console.error('[Audio] Stop recording error:', err);
      await forceCleanup();
    }
  };

  const cancelRecording = async () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    await forceCleanup();
    resetAnimations();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetAnimations = () => {
    micScale.value = withSpring(1);
    redDotOpacity.value = withTiming(1);
    waveHeights.forEach(h => h.value = withSpring(5));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVoiceInput = async (uri: string) => {
    setLoading(true);
    try {
      const text = await transcribeAudio(uri);
      setInput(text);
      await sendMessage(text);
    } catch (error) {
      Alert.alert('Error', 'Could not understand voice. Please try typing.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== '1') 
        .concat(userMessage)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response: AIResponse = await processChat(history);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        orderPreview: response.orderPreview,
        status: response.status
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.status === 'ordered' && response.orderPreview) {
        confirmOrder(response.orderPreview, true);
      }

      Speech.speak(response.message, { 
        language: response.message.match(/[\u0600-\u06FF]/) ? 'ur-PK' : 'en-US' 
      });

    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (items: OrderItem[], isAuto = false) => {
    const productData: Record<string, { price: number; image: string }> = {
      '023d4a9d-9329-463e-8e55-7aae836c3f5f': { price: 12.50, image: 'https://images.unsplash.com/photo-1570968015861-d55f41bc1a74?w=800' },
      '5b223f6d-0b4f-4e77-817a-9a4e65ec1100': { price: 8.00, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
      '1dd4dc46-87b8-403b-ae9f-731c84ae5cca': { price: 6.25, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800' },
      '8e0eca5e-d530-4c52-91c6-188b30846b24': { price: 7.00, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
      'mocha-001': { price: 7.50, image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800' },
      'matcha-001': { price: 8.25, image: 'https://images.unsplash.com/photo-1582722872445-44ad5f7844dd?w=800' },
      'tea-001': { price: 6.00, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800' },
      'food-001': { price: 4.50, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' },
      'food-002': { price: 3.75, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800' },
    };

    const cartItems = items.map(item => {
      const details = productData[item.id] || { price: 0, image: '' };
      return {
        id: item.id,
        name: item.name,
        price: details.price,
        quantity: item.quantity,
        options: `${item.size}${item.customizations ? ', ' + item.customizations : ''}`,
        image: details.image
      };
    });

    if (isAuto) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        
        if (user) {
          const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const { error } = await supabase.from('orders').insert({
            user_id: user.id,
            total_amount: totalAmount * 1.08, 
            items: cartItems,
            status: 'pending'
          });

          if (error) throw error;
          Alert.alert('Order Placed!', 'Your AI ritual has been recorded.');
        } else {
          cartItems.forEach(i => addToCart(i));
          Alert.alert('Added to Cart', 'Sign in to place orders automatically next time.');
        }
      } catch (err) {
        console.error('AI Order Error:', err);
        cartItems.forEach(i => addToCart(i));
        Alert.alert('Selection Ready', 'Your rituals have been added to the cart.');
      }
      return;
    }

    cartItems.forEach(i => addToCart(i));
    Alert.alert('Selection Ready', 'Your rituals have been added to the cart.', [
      { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      { text: 'Okay', style: 'cancel' }
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
          {item.content}
        </Text>
        
        {item.orderPreview && item.orderPreview.length > 0 && (
          <View style={styles.orderCard}>
            <Text style={styles.orderCardTitle}>Order Preview:</Text>
            {item.orderPreview.map((orderItem, idx) => (
                <View key={idx} style={styles.orderItemRow}>
                  <Image 
                    source={{ uri: orderItem.image || 'https://via.placeholder.com/150' }} 
                    style={styles.orderItemImage} 
                  />
                  <Text style={styles.orderItemText}>
                    {orderItem.quantity}x {orderItem.name} ({orderItem.size})
                  </Text>
                </View>
            ))}
            {item.status === 'confirming' && (
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => confirmOrder(item.orderPreview!)}
              >
                <Text style={styles.confirmButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={150} height={24} />
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, padding: 20, gap: 16 }}>
          <Skeleton width="70%" height={60} borderRadius={20} alignSelf="flex-start" />
          <Skeleton width="50%" height={40} borderRadius={20} alignSelf="flex-end" />
          <Skeleton width="80%" height={100} borderRadius={20} alignSelf="flex-start" />
        </View>
        <View style={styles.inputWrapper}>
          <Skeleton width="100%" height={56} borderRadius={28} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Concierge</Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text style={styles.loadingText}>Processing Ritual...</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          {isRecording ? (
            <View style={styles.whatsappContainer}>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelBtn}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.outline} />
              </TouchableOpacity>
              <View style={styles.whatsappLeft}>
                <Animated.View style={[styles.redDot, redDotAnimatedStyle]} />
                <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
              </View>
              <View style={styles.whatsappCenter}>
                <View style={styles.waveform}>
                  {waveHeights.map((h, i) => (
                    <Animated.View key={i} style={[styles.waveBar, { height: h }]} />
                  ))}
                </View>
                <Text style={styles.slideText}>Ordering with voice...</Text>
              </View>
              <TouchableOpacity onPress={stopRecording} style={styles.whatsappStop}>
                 <Ionicons name="send" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Speak or type your order..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={input}
                onChangeText={setInput}
                multiline
              />
              
              <TouchableOpacity 
                style={styles.voiceButton} 
                onPress={startRecording}
              >
                <Ionicons name="mic" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                <Ionicons name="arrow-up" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  chatList: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    maxWidth: '85%',
    padding: theme.spacing.md,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceContainer,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...theme.typography.bodyLarge,
    lineHeight: 24,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: theme.colors.onBackground,
  },
  inputWrapper: {
    padding: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    backgroundColor: theme.colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 30,
    paddingRight: 6,
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: theme.colors.onBackground,
    ...theme.typography.bodyMedium,
    maxHeight: 100,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  whatsappContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 30,
    paddingHorizontal: 12,
    height: 56,
  },
  cancelBtn: {
    padding: 8,
  },
  whatsappLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginRight: 6,
  },
  timerText: {
    color: theme.colors.onBackground,
    ...theme.typography.labelMedium,
    fontWeight: 'bold',
  },
  whatsappCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 6,
  },
  waveBar: {
    width: 2.5,
    backgroundColor: theme.colors.primary,
    borderRadius: 1.25,
  },
  slideText: {
    color: theme.colors.outline,
    ...theme.typography.bodySmall,
  },
  whatsappStop: {
    padding: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: theme.colors.primary,
    ...theme.typography.labelSmall,
    fontWeight: 'bold',
  },
  orderCard: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orderCardTitle: {
    color: theme.colors.primary,
    ...theme.typography.labelSmall,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
  },
  orderItemText: {
    color: theme.colors.onBackground,
    ...theme.typography.bodySmall,
    flex: 1,
  },
  confirmButton: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    ...theme.typography.labelMedium,
    fontWeight: 'bold',
  },
});
