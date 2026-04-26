import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../src/styles/theme';
import { IconSymbol } from '../src/components/ui/IconSymbol';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/context/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Skeleton from '../src/components/ui/Skeleton';

export default function SupportScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        router.push('/login');
        return;
      }

      setLoading(true);
      fetchMessages();

      const channel = supabase
        .channel('support_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const incoming = payload.new as any;
            // avoid duplicating optimistic messages (same content + sender within 5s)
            setMessages((current) => {
              const isDupe = current.some(
                (m) =>
                  m.id?.toString().startsWith('temp-') &&
                  m.content === incoming.content &&
                  m.sender_type === incoming.sender_type
              );
              if (isDupe) {
                // replace the temp message with the real one
                return current.map((m) =>
                  m.id?.toString().startsWith('temp-') &&
                  m.content === incoming.content
                    ? incoming
                    : m
                );
              }
              return [...current, incoming];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [session])
  );

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      // Scroll to bottom immediately after load
      flatListRef.current?.scrollToEnd({ animated: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      user_id: session?.user.id,
      content: text,
      sender_type: 'customer',
      created_at: new Date().toISOString(),
      is_read: false,
    };

    // Optimistic update — appears instantly
    setMessages((prev) => [...prev, optimisticMessage]);
    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      const { error } = await supabase.from('messages').insert({
        user_id: session?.user.id,
        content: text,
        sender_type: 'customer',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      // Roll back optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isCustomer = item.sender_type === 'customer';
    const isTemp = item.id?.toString().startsWith('temp-');
    return (
      <View
        style={[
          styles.messageBubble,
          isCustomer ? styles.customerBubble : styles.adminBubble,
          isTemp && { opacity: 0.7 },
        ]}
      >
        {!isCustomer && <Text style={styles.senderLabel}>Artisan Support</Text>}
        <Text
          style={[
            styles.messageText,
            isCustomer ? styles.customerText : styles.adminText,
          ]}
        >
          {item.content}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ marginLeft: 12 }}>
            <Skeleton width={120} height={20} />
            <Skeleton width={150} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, gap: 16 }}>
          <Skeleton width="60%" height={60} borderRadius={16} alignSelf="flex-start" />
          <Skeleton width="70%" height={80} borderRadius={16} alignSelf="flex-end" />
          <Skeleton width="50%" height={40} borderRadius={16} alignSelf="flex-start" />
          <Skeleton width="80%" height={100} borderRadius={16} alignSelf="flex-end" />
        </View>
        <View style={styles.inputContainer}>
          <Skeleton flex={1} height={48} borderRadius={24} />
          <Skeleton width={48} height={48} borderRadius={24} style={{ marginLeft: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Artisan Support</Text>
            <Text style={styles.headerSubtitle}>Direct ritual assistance</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="bolt.fill" size={48} color={theme.colors.outline} />
              <Text style={styles.emptyText}>
                Start a conversation with our master brewers.
              </Text>
            </View>
          }
        />

        {/* Input bar — always hugs the keyboard */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={theme.colors.outline}
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <IconSymbol name="paperplane.fill" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: theme.colors.onBackground,
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: theme.colors.primary,
    ...theme.typography.labelSmall,
    textTransform: 'uppercase',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  customerBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderBottomLeftRadius: 4,
  },
  senderLabel: {
    color: theme.colors.primary,
    ...theme.typography.labelSmall,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    ...theme.typography.bodyMedium,
  },
  customerText: {
    color: 'white',
  },
  adminText: {
    color: theme.colors.onSurface,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: 'white',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    color: theme.colors.outline,
    ...theme.typography.bodySmall,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
