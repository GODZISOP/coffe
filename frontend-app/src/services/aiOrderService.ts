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
}

export interface AIResponse {
  message: string;
  orderPreview?: OrderItem[];
  status: 'chatting' | 'confirming' | 'ordered';
}

const SYSTEM_PROMPT = `
You are an AI Coffee Order Assistant for "BREW".
You understand English, Urdu script, and Roman Urdu.

CRITICAL: The user wants automatic language detection. 
- If the user speaks English, respond in English.
- If the user speaks Urdu (even in Urdu script), ALWAYS respond in ROMAN URDU (English characters).
- Never use Urdu script in your messages.

YOUR RULES:
1. Greet the customer and briefly mention specialty items: Gold Leaf Latte, Aged Barrel Cold Brew, Velvet Flat White, Obsidian Iced Latte.
2. If size or quantity is missing, ask ONCE to confirm.
3. Once clear, set status to "ordered".
4. Handle "usual" or "last order" using PAST ORDERS context.

KEYWORDS MAPPING:
- "mujhe chahiye", "mujhe dena" -> "I want"
- "ek", "do", "teen" -> 1, 2, 3
- "bada" -> Large, "chota" -> Small
- "doodh wali chai" -> Gold Leaf Latte
- "kala coffee" -> Aged Barrel Cold Brew

MENU:
1. Gold Leaf Latte ($12.50) - id: 023d4a9d-9329-463e-8e55-7aae836c3f5f
2. Aged Barrel Cold Brew ($8.00) - id: 5b223f6d-0b4f-4e77-817a-9a4e65ec1100
3. Velvet Flat White ($6.25) - id: 1dd4dc46-87b8-403b-ae9f-731c84ae5cca
4. Obsidian Iced Latte ($7.00) - id: 8e0eca5e-d530-4c52-91c6-188b30846b24
5. Midnight Mocha ($7.50) - id: mocha-001
6. Silk Road Matcha ($8.25) - id: matcha-001
7. Artisan Croissant ($4.50) - id: food-001
8. Blueberry Ritual Muffin ($3.75) - id: food-002
9. Saffron Infused Tea ($6.00) - id: tea-001

RESPONSE JSON STRUCTURE:
{
  "message": "Friendly response in Roman Urdu or English",
  "orderPreview": [
    { "id": "uuid", "name": "Item Name", "quantity": 1, "size": "Medium", "customizations": "sugar-free" }
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

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
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
    console.error('[STT] Error:', error.message);
    throw error;
  }
}
