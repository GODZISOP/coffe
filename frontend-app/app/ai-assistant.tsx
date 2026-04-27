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
  withSpring, 
  withTiming,
  FadeInUp,
  Layout
} from 'react-native-reanimated';
import Skeleton from '../src/components/ui/Skeleton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  orderPreview?: OrderItem[];
  status?: string;
}

const PRODUCT_DATA: Record<string, { price: number; image: string }> = {
  '023d4a9d-9329-463e-8e55-7aae836c3f5f': { price: 12.50, image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=800' },
  '5b223f6d-0b4f-4e77-817a-9a4e65ec1100': { price: 8.00, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
  'rose-001': { price: 8.50, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800' },
  'lavender-001': { price: 7.75, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800' },
  'turkish-001': { price: 9.00, image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800' },
  'hibiscus-001': { price: 6.50, image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800' },
  'tea-001': { price: 6.00, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800' },
  'food-001': { price: 4.50, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' },
  'food-002': { price: 3.75, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800' },
};

export default function AIAssistantScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Salam! Saffron Pistachio Latte ya Turkish Delight Mocha kaisa rahega aaj?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const micScale = useSharedValue(1);
  const redDotOpacity = useSharedValue(1);
  const waveHeights = Array.from({ length: 5 }, () => useSharedValue(5));

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        forceCleanup();
      };
    }, [])
  );

  const forceCleanup = async () => {
    if (recordingRef.current) {
      try {
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
      await forceCleanup();
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        }
      );
      
      recordingRef.current = newRecording;
      setIsRecording(true);
      setRecordingTime(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    } catch (err) {
      console.error('[Audio] Failed to start:', err);
      await forceCleanup();
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      const status = await recordingRef.current.getStatusAsync();
      if (status.isRecording) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        resetAnimations();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (uri) handleVoiceInput(uri);
      }
    } catch (err) {
      console.error('[Audio] Stop error:', err);
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

  const handleVoiceInput = async (uri: string) => {
    setLoading(true);
    try {
      const transcript = await transcribeAudio(uri);
      sendMessage(transcript);
    } catch (err: any) {
      Alert.alert('Speech Error', err.message);
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await processChat(chatHistory);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        orderPreview: response.orderPreview?.map(item => {
          const id = (item.id || '').toLowerCase();
          let image = item.image || PRODUCT_DATA[item.id]?.image;
          
          if (!image) {
            const lowerId = id.toLowerCase();
            const lowerName = item.name.toLowerCase();
            if (lowerId.includes('gold') || lowerName.includes('gold') || lowerId.includes('saffron')) {
              image = PRODUCT_DATA['023d4a9d-9329-463e-8e55-7aae836c3f5f'].image;
            } else if (lowerId.includes('rose')) {
              image = PRODUCT_DATA['rose-001'].image;
            } else if (lowerId.includes('lavender')) {
              image = PRODUCT_DATA['lavender-001'].image;
            } else if (lowerId.includes('turkish')) {
              image = PRODUCT_DATA['turkish-001'].image;
            } else if (lowerId.includes('hibiscus')) {
              image = PRODUCT_DATA['hibiscus-001'].image;
            }
          }

          return {
            ...item,
            image: image || 'https://images.unsplash.com/photo-1510970174660-c19504271b3f?w=200'
          };
        }),
        status: response.status
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (response.status === 'ordered' && response.orderPreview) {
        confirmOrder(response.orderPreview, true);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Connection issue. Please retry.' }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (items: OrderItem[], isAuto = false) => {
    const cartItems = items.map(item => {
      const details = PRODUCT_DATA[item.id] || { price: 8.50, image: item.image || '' };
      const finalImage = item.image || details.image;
      return {
        id: item.id,
        name: item.name,
        price: details.price || 8.50,
        quantity: item.quantity,
        options: `${item.size}${item.customizations ? ', ' + item.customizations : ''}`,
        image: finalImage,
        image_url: finalImage 
      };
    });

    if (isAuto) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const totalAmount = cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          const { error } = await supabase.from('orders').insert({
            user_id: user.id,
            total_amount: totalAmount * 1.08, 
            items: cartItems,
            status: 'pending'
          });
          if (!error) Alert.alert('Success!', 'Order placed automatically.');
        } else {
          cartItems.forEach(i => addToCart(i));
        }
      } catch (err) {
        cartItems.forEach(i => addToCart(i));
      }
      return;
    }

    cartItems.forEach(i => addToCart(i));
    Alert.alert('Ritual Ready', 'Items added to cart.', [{ text: 'View Cart', onPress: () => router.push('/(tabs)/cart') }, { text: 'Okay' }]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>{item.content}</Text>
        {item.orderPreview && item.orderPreview.length > 0 && (
          <View style={styles.orderCard}>
            <Text style={styles.orderCardTitle}>PREVIEW:</Text>
            {item.orderPreview.map((orderItem, idx) => (
                <View key={idx} style={styles.orderItemRow}>
                  <Image source={{ uri: orderItem.image || 'https://via.placeholder.com/150' }} style={styles.orderItemImage} />
                  <Text style={styles.orderItemText}>{orderItem.quantity}x {orderItem.name} ({orderItem.size})</Text>
                </View>
            ))}
            {item.status === 'confirming' && (
              <TouchableOpacity style={styles.confirmButton} onPress={() => confirmOrder(item.orderPreview!)}>
                <Text style={styles.confirmButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const redDotAnimatedStyle = useAnimatedStyle(() => ({ opacity: redDotOpacity.value }));
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}><Skeleton width={40} height={40} borderRadius={20} /><Skeleton width={150} height={24} /><View style={{ width: 40 }} /></View>
        <View style={{ flex: 1, padding: 20, gap: 16 }}><Skeleton width="70%" height={60} borderRadius={20} /><Skeleton width="50%" height={40} borderRadius={20} alignSelf="flex-end" /><Skeleton width="80%" height={100} borderRadius={20} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color={theme.colors.primary} /></TouchableOpacity>
          <Text style={styles.headerTitle}>AI CONCIERGE</Text>
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

        {loading && <View style={styles.loadingContainer}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.loadingText}>Ritual in progress...</Text></View>}

        <View style={styles.inputWrapper}>
          {isRecording ? (
            <View style={styles.whatsappContainer}>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelBtn}><Ionicons name="trash-outline" size={20} color={theme.colors.outline} /></TouchableOpacity>
              <View style={styles.whatsappLeft}><Animated.View style={[styles.redDot, redDotAnimatedStyle]} /><Text style={styles.timerText}>{formatTime(recordingTime)}</Text></View>
              <View style={styles.whatsappCenter}>
                <View style={styles.waveform}>{waveHeights.map((h, i) => <Animated.View key={i} style={[styles.waveBar, { height: h }]} />)}</View>
                <Text style={styles.slideText}>Listening...</Text>
              </View>
              <TouchableOpacity onPress={stopRecording} style={styles.whatsappStop}><Ionicons name="stop-circle" size={32} color={theme.colors.primary} /></TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder="Talk to us..." placeholderTextColor={theme.colors.outline} value={inputText} onChangeText={setInputText} />
              <TouchableOpacity onPress={inputText ? () => sendMessage(inputText) : startRecording} style={[styles.micButton, inputText && styles.sendButton]}>
                <Ionicons name={inputText ? "send" : "mic"} size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  chatList: { padding: 16, paddingBottom: 32 },
  messageContainer: { maxWidth: '85%', padding: 14, borderRadius: 20, marginBottom: 12 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: theme.colors.primaryContainer },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceContainerHigh },
  messageText: { fontSize: 16, lineHeight: 22 },
  userMessageText: { color: theme.colors.onPrimaryContainer },
  assistantMessageText: { color: theme.colors.onSurface },
  inputWrapper: { padding: 16, backgroundColor: theme.colors.background },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceContainer, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 4 },
  input: { flex: 1, height: 48, color: theme.colors.onSurface, paddingHorizontal: 12, fontSize: 16 },
  micButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendButton: { backgroundColor: theme.colors.secondary },
  whatsappContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 30, padding: 8, gap: 12 },
  whatsappLeft: { flexDirection: 'row', alignItems: 'center', width: 60, gap: 4 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3b30' },
  timerText: { color: theme.colors.onSurface, fontWeight: 'bold' },
  whatsappCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 8 },
  waveBar: { width: 3, backgroundColor: theme.colors.primary, borderRadius: 1.5 },
  slideText: { color: theme.colors.outline, fontSize: 12 },
  loadingContainer: { flexDirection: 'row', padding: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
  orderCard: { marginTop: 12, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 16, padding: 12, borderHorizontal: 1, borderColor: 'rgba(255,255,255,0.05)' },
  orderCardTitle: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  orderItemImage: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
  orderItemText: { color: theme.colors.onSurface, fontSize: 14, flex: 1 },
  confirmButton: { marginTop: 12, backgroundColor: theme.colors.primary, padding: 12, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: 'white', fontWeight: 'bold' }
});
