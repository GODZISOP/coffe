const supabase = require('../config/supabase');
const { sendStatusNotification } = require('./notificationService');

const startAutoBarista = () => {
  console.log('🤖 Auto-Barista Initialized: Listening for orders...');
  
  const channelId = `ritual-engine-${Date.now()}`;
  const channel = supabase.channel(channelId);
  
  channel
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'orders' 
    }, async (payload) => {
      const orderId = payload.new.id;
      console.log(`☕ New Order Received: ${orderId}. Starting ritual...`);

      // 1. Move to Preparing after 5 seconds
      setTimeout(async () => {
        await supabase.from('orders').update({ status: 'preparing' }).eq('id', orderId);
        console.log(`👨‍🍳 Order ${orderId} is now BEING PREPARED.`);
      }, 5000);

      // 2. Move to Ready after 15 seconds
      setTimeout(async () => {
        await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
        console.log(`✅ Order ${orderId} is READY for pickup!`);
      }, 15000);

      // 3. Complete after 30 seconds
      setTimeout(async () => {
        await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
        console.log(`🏁 Order ${orderId} ritual COMPLETE.`);
      }, 30000);
    })
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'orders' 
    }, async (payload) => {
      const { id, status } = payload.new;
      const oldStatus = payload.old?.status;

      console.log(`🔔 DB UPDATE Detected: Order ${id} (${oldStatus} -> ${status})`);
      
      if (status !== oldStatus) {
        console.log(`📣 Status Change Valid: Sending notification...`);
        await sendStatusNotification(id, status);
      }
    })
    .subscribe((status, err) => {
      console.log(`📡 Supabase Realtime Subscription Status: ${status}`);
      if (err) console.error('❌ Realtime Error:', err);
    });
};

module.exports = { startAutoBarista };
