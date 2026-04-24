const supabase = require('../config/supabase');
const { getExpo } = require('../config/expo');

async function sendStatusNotification(orderId, status) {
  try {
    const expo = getExpo();
    if (!expo) {
      console.log('⚠️ Notification skipped: Expo not initialized');
      return;
    }

    // 1. Get the user's push token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Error fetching order or order not found:', orderError);
      return;
    }

    console.log(`👤 Found User ID: ${order.user_id} for Order ${orderId}`);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('expo_push_token, full_name')
      .eq('id', order.user_id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    if (!profile?.expo_push_token) {
      console.log('⚠️ No push token found for user profile');
      return;
    }

    let message = '';
    let title = 'BREW Update';

    if (status === 'preparing') {
      title = 'Ritual Started';
      message = `Hey ${profile.full_name || 'there'}, your order is being prepared! ☕`;
    } else if (status === 'ready') {
      title = 'Order Ready! ☕';
      message = 'Your coffee is waiting for you at the counter.';
    } else if (status === 'completed') {
      title = 'Enjoy your coffee!';
      message = 'Thanks for choosing BREW. See you next time!';
    }

    if (!message) {
      console.log('⚠️ Notification skipped: No message for status', status);
      return;
    }

    console.log(`📡 Sending Push to token: ${profile.expo_push_token.slice(0, 20)}...`);

    const chunks = expo.chunkPushNotifications([
      {
        to: profile.expo_push_token,
        sound: 'default',
        title,
        body: message,
        data: { orderId },
      },
    ]);

    for (let chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('✅ Expo Ticket Response:', JSON.stringify(ticketChunk));
    }
  } catch (e) {
    console.error('❌ Push Notification Error:', e);
  }
}

module.exports = { sendStatusNotification };
