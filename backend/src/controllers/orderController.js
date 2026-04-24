const supabase = require('../config/supabase');
const { sendStatusNotification } = require('../services/notificationService');

exports.getAllOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name)');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(`📥 Received Status Update for Order ${id}: ${status}`);
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    
    console.log(`✅ Database Update Success for Order ${id}`);

    // Send notification in the background
    console.log(`📣 Triggering Push Notification for status: ${status}`);
    sendStatusNotification(id, status).catch(err => 
      console.error('❌ Background Notification Error:', err)
    );
    
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
