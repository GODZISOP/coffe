import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useOrders(activeTab: string, user: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      const channel = supabase
        .channel('admin-updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          // Play sound and show notification for new orders
          audioRef.current?.play().catch(() => {});
          if (Notification.permission === 'granted') {
            new Notification('New Ritual Received!', {
              body: `Order #${payload.new.id.slice(0, 6).toUpperCase()} is waiting for preparation.`,
              icon: '/favicon.png'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
          fetchData();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
          fetchData();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const { data, error } = await supabase.from('sales_analytics').select('*');
        if (error) throw error;
        if (data) {
          const revenue = data.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
          const count = data.reduce((acc, curr) => acc + (curr.total_orders || 0), 0);
          setStats({ revenue, count, breakdown: data });
        }
      } else if (activeTab === 'orders') {
        const { data, error } = await supabase
          .from('orders')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setOrders(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const previousOrders = [...orders];
    setOrders(current => 
      current.map(order => 
        order.id === id ? { ...order, status } : order
      )
    );

    try {
      let backendFailed = false;
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (!response.ok) {
          backendFailed = true;
        }
      } catch (networkError) {
        // Fetch throws if server is unreachable
        backendFailed = true;
      }

      if (backendFailed) {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Update failed, rolling back:', err);
      setOrders(previousOrders);
      alert('Failed to update order status.');
    }
    fetchData();
  };

  return { orders, stats, loading, fetchData, updateStatus };
}
