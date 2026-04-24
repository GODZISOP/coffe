import React from 'react';

export const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ready: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-white/5 text-[#8b7355] border-white/10',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};
