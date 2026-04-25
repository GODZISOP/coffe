import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { HelpPage } from './pages/HelpPage';
import { useAuth } from './hooks/useAuth';
import { useOrders } from './hooks/useOrders';
import { Loader } from './components/ui/Loader';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'help'>('orders');
  const { user, loading: authLoading, login, logout } = useAuth();
  const { orders, stats, loading, fetchData, updateStatus } = useOrders(activeTab, user);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] flex items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-[#f5f5f5] flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto">
        <Header 
          activeTab={activeTab} 
          onRefresh={fetchData} 
          onLogout={logout} 
        />

        <div className="p-10">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardPage stats={stats} onNavigate={setActiveTab} />}
              {activeTab === 'orders' && <OrdersPage orders={orders} onUpdate={updateStatus} />}
              {activeTab === 'menu' && (
                <div className="h-64 flex items-center justify-center text-[#8b7355]">
                  Menu Manager Coming Soon...
                </div>
              )}
              {activeTab === 'help' && <HelpPage />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
