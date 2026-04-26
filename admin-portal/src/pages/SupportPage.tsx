import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, User, Clock, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  user_id: string;
  sender_type: 'customer' | 'admin';
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatUser {
  user_id: string;
  email: string;
  last_message: string;
  last_time: string;
  unread_count: number;
}

export const SupportPage = () => {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatUsers();

    const channel = supabase
      .channel('admin_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // If message is for currently selected user, add to view
          if (newMessage.user_id === selectedUserId) {
            setMessages((prev) => [...prev, newMessage]);
          }
          
          // Refresh user list to show last message/unread
          fetchChatUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatUsers = async () => {
    try {
      // For this demo, we'll get unique user_ids from messages
      const { data, error } = await supabase
        .from('messages')
        .select('*, user_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersMap = new Map<string, ChatUser>();
      data?.forEach((m: any) => {
        if (!usersMap.has(m.user_id)) {
          usersMap.set(m.user_id, {
            user_id: m.user_id,
            email: `Customer ${m.user_id.slice(0, 5)}`, // In production, join with profiles
            last_message: m.content,
            last_time: m.created_at,
            unread_count: m.is_read ? 0 : (m.sender_type === 'customer' ? 1 : 0)
          });
        }
      });

      setChatUsers(Array.from(usersMap.values()));
    } catch (err) {
      console.error('Error fetching chat users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('sender_type', 'customer');
        
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessages(userId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUserId) return;

    const reply = {
      user_id: selectedUserId,
      sender_type: 'admin',
      content: inputText.trim(),
    };

    setInputText('');

    try {
      const { error } = await supabase.from('messages').insert(reply);
      if (error) throw error;
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-[#1a1716] rounded-xl overflow-hidden border border-white/5">
      {/* Sidebar: Users List */}
      <div className="w-80 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5 bg-[#231f1d]">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#8b7355]" />
            Active Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatUsers.length === 0 ? (
            <div className="p-10 text-center text-[#555]">No active support requests.</div>
          ) : (
            chatUsers.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleUserSelect(user.user_id)}
                className={`w-full p-4 text-left border-b border-white/5 transition-colors flex gap-3 ${
                  selectedUserId === user.user_id ? 'bg-[#8b7355]/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#2a2624] flex items-center justify-center text-[#8b7355]">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-[#f5f5f5] truncate">{user.email}</span>
                    <span className="text-[10px] text-[#555] whitespace-nowrap">
                      {new Date(user.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[#8b7355] truncate mt-1">{user.last_message}</p>
                </div>
                {user.unread_count > 0 && (
                  <div className="w-2 h-2 rounded-full bg-[#8b7355] mt-2"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-[#231f1d] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2a2624] flex items-center justify-center text-[#8b7355]">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-bold">Chatting with Customer</span>
              </div>
              <div className="text-[11px] text-[#555] uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Real-time support active
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-xl text-sm ${
                      m.sender_type === 'admin'
                        ? 'bg-[#8b7355] text-white rounded-tr-none'
                        : 'bg-[#2a2624] text-[#f5f5f5] rounded-tl-none border border-white/5'
                    }`}
                  >
                    {m.content}
                    <div className={`text-[10px] mt-1 opacity-50 ${m.sender_type === 'admin' ? 'text-right' : 'text-left'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-[#231f1d] border-top border-white/5 flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your official reply..."
                className="flex-1 bg-[#1a1716] border border-white/10 rounded-lg px-4 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#8b7355]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-[#8b7355] hover:bg-[#a68a68] disabled:opacity-50 text-white p-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Reply
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <MessageCircle className="w-16 h-16 mb-4" />
            <p>Select a conversation to start ritual support</p>
          </div>
        )}
      </div>
    </div>
  );
};
