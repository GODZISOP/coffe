import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const HISTORY_KEY = '@brew_order_history';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  size: 'Small' | 'Medium' | 'Large';
  customizations?: string;
  image?: string;
}

export interface AIResponse {
  message: string;
  orderPreview?: OrderItem[];
  status: 'chatting' | 'confirming' | 'ordered';
}

const SYSTEM_PROMPT = `
You are an AI Coffee Order Assistant for "BREW".
You understand English, Urdu script, and Roman Urdu.

CRITICAL: Respond in ROMAN URDU if user speaks Urdu.

MENU (Strictly use these IDs and Images):
1. Aged Barrel Cold Brew ($8.00) - id: 5b223f6d-0b4f-4e77-817a-9a4e65ec1100 - image: https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800
2. Velvet Flat White ($6.25) - id: 1dd4dc46-87b8-403b-ae9f-731c84ae5cca - image: https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800
3. Velvet Flat White ($6.25) - id: 1dd4dc46-87b8-403b-ae9f-731c84ae5cca - image: https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800
4. Obsidian Iced Latte ($7.00) - id: 8e0eca5e-d530-4c52-91c6-188b30846b24 - image: https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800
5. Midnight Mocha ($7.50) - id: mocha-001 - image: https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800
6. Rose Petal Cappuccino ($8.50) - id: rose-001 - image: https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800
7. Lavender Honey Latte ($7.75) - id: lavender-001 - image: https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800
8. Turkish Delight Mocha ($9.00) - id: turkish-001 - image: https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800
9. Smoked Vanilla Latte ($8.25) - id: vanilla-001 - image: https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800
10. Coconut Cloud Macchiato ($7.50) - id: coconut-001 - image: https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800
11. Artisan Croissant ($4.50) - id: food-001 - image: https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800
12. Blueberry Ritual Muffin ($3.75) - id: food-002 - image: https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800
13. Almond Croissant ($5.50) - id: food-003 - image: https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800
14. Pain au Chocolat ($5.25) - id: food-004 - image: https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800
15. Saffron Infused Tea ($6.00) - id: tea-001 - image: https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800

KEYWORDS MAPPING:
- "saffron", "pistachio", "gold leaf" -> Saffron Pistachio Latte
- "rose", "cappuccino" -> Rose Petal Cappuccino
- "lavender" -> Lavender Honey Latte
- "turkish" -> Turkish Delight Mocha
- "hibiscus" -> Iced Hibiscus Tea
- "usual" -> Refer to past orders

RESPONSE JSON STRUCTURE:
{
  "message": "Friendly response",
  "orderPreview": [
    { "id": "uuid", "name": "Item Name", "quantity": 1, "size": "Medium", "image": "URL" }
  ],
  "status": "chatting" | "confirming" | "ordered"
}
`;

export async function saveOrderToHistory(items: OrderItem[]) {
  try {
    const existing = await AsyncStorage.getItem(HISTORY_KEY);
    const history = existing ? JSON.parse(existing) : [];
    const newHistory = [...items, ...history].slice(0, 10);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error('Failed to save history', e);
  }
}

async function getOrderHistory(): Promise<string> {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? `PAST ORDERS: ${history}` : "PAST ORDERS: None yet.";
  } catch {
    return "PAST ORDERS: None.";
  }
}

export async function processChat(messages: { role: string; content: string }[]): Promise<AIResponse> {
  if (!GROQ_API_KEY) return { message: "API Key missing.", status: 'chatting' };
  const historyContext = await getOrderHistory();

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + "\n\n" + historyContext },
          ...messages
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed: AIResponse = JSON.parse(content);
    if (parsed.status === 'ordered' && parsed.orderPreview) saveOrderToHistory(parsed.orderPreview);
    return parsed;
  } catch (error: any) {
    console.error('AI Service Error:', error.message);
    return { message: "Maaf kijiye, kuch masla ho gaya.", status: 'chatting' };
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('API Key missing');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // Extended to 60s

  try {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    console.log(`[STT] Transcribing: ${audioUri} (${fileInfo.size} bytes)`);

    const formData = new FormData();
    const filename = audioUri.split('/').pop() || 'recording.m4a';
    
    // @ts-ignore
    formData.append('file', {
      uri: Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri,
      type: 'audio/m4a',
      name: filename,
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ur');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STT] Groq API Error:', response.status, errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.text?.trim();

    if (!transcript) {
      console.warn('[STT] Empty transcript received');
      throw new Error('Could not hear any speech');
    }

    console.log('[STT] Transcript:', transcript);
    return transcript;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[STT] Request timed out');
      throw new Error('Connection timed out. Please try a shorter message or check your internet.');
    }
    console.error('[STT] Error:', error.message);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
