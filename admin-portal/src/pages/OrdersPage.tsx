import React from 'react';
import { OrderTable } from '../components/orders/OrderTable';

export const OrdersPage = ({ orders, onUpdate }: any) => {
  return (
    <div className="space-y-6">
      <OrderTable orders={orders} onUpdate={onUpdate} />
    </div>
  );
};
