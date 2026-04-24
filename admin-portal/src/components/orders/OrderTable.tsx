import React from 'react';
import { StatusBadge } from './StatusBadge';
import { ActionButton } from '../ui/ActionButton';

interface OrderTableProps {
  orders: any[];
  onUpdate: (id: string, status: string) => void;
}

export const OrderTable = ({ orders, onUpdate }: OrderTableProps) => {
  return (
    <div className="bg-[#1a1716] rounded-2xl border border-white/5 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5 text-xs text-[#8b7355] uppercase tracking-widest">
            <th className="px-8 py-5 font-medium">Customer</th>
            <th className="px-8 py-5 font-medium">Items</th>
            <th className="px-8 py-5 font-medium">Status</th>
            <th className="px-8 py-5 font-medium">Amount</th>
            <th className="px-8 py-5 font-medium">Placed At</th>
            <th className="px-8 py-5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-8 py-6">
                <div className="flex flex-col">
                  <span className="font-medium text-[#f5f5f5]">{order.profiles?.full_name || 'Guest Artisan'}</span>
                  <span className="text-[10px] font-mono text-[#d4a373]">#{order.id.slice(0, 8)}</span>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-col gap-1">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <span className="text-[#d4a373] font-bold">{item.quantity}x</span> {item.name}
                      {item.options && <span className="text-[#8b7355] text-[10px]"> ({item.options})</span>}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-8 py-6">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-8 py-6 font-medium text-[#d4a373]">${order.total_amount.toFixed(2)}</td>
              <td className="px-8 py-6 text-sm text-[#8b7355]">
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-8 py-6 text-right space-x-2">
                {order.status === 'pending' && (
                  <ActionButton
                    onClick={() => onUpdate(order.id, 'preparing')}
                    label="Accept"
                    color="bg-[#d4a373]"
                  />
                )}
                {order.status === 'preparing' && (
                  <ActionButton onClick={() => onUpdate(order.id, 'ready')} label="Ready" color="bg-[#4caf50]" />
                )}
                {order.status === 'ready' && (
                  <ActionButton onClick={() => onUpdate(order.id, 'completed')} label="Complete" color="bg-[#2196f3]" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
