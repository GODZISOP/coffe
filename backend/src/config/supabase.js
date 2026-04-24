const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Test Connection
supabase.from('orders').select('count', { count: 'exact', head: true }).then(({ count, error }) => {
  if (error) console.error('❌ Supabase Connection Test Failed:', error.message);
  else console.log('✅ Supabase Connection Test Successful');
});

module.exports = supabase;
