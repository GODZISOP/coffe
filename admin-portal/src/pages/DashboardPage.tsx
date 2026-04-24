import React from 'react';
import { TrendingUp, ShoppingBag, Clock } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';

export const DashboardPage = ({ stats }: any) => {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Revenue" value={`$${stats?.revenue?.toFixed(2) || '0.00'}`} icon={<TrendingUp className="text-[#4caf50]" />} />
        <StatCard title="Total Orders" value={stats?.count || 0} icon={<ShoppingBag className="text-[#d4a373]" />} />
        <StatCard title="Avg. Prep Time" value="4:20 min" icon={<Clock className="text-[#2196f3]" />} />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-6">Order Status Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats?.breakdown?.map((item: any) => (
            <div key={item.status} className="bg-[#1a1716] p-6 rounded-xl border border-white/5">
              <p className="text-xs text-[#8b7355] uppercase tracking-wider mb-2">{item.status}</p>
              <p className="text-2xl font-bold">{item.total_orders}</p>
              <p className="text-xs text-[#8b7355] mt-1">${item.total_revenue?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
