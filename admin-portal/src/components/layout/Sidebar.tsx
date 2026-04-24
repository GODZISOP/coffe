import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Coffee,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  return (
    <aside className="w-64 bg-[#1a1716] border-r border-white/5 p-6 flex flex-col">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold tracking-[0.2em] text-[#d4a373]">BREW</h1>
        <p className="text-[10px] tracking-[0.3em] text-[#8b7355] mt-1 uppercase">Admin Console</p>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
        />
        <NavItem
          active={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          icon={<ShoppingBag size={20} />}
          label="Live Orders"
        />
        <NavItem
          active={activeTab === 'menu'}
          onClick={() => setActiveTab('menu')}
          icon={<Coffee size={20} />}
          label="Menu Manager"
        />
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[#d4a373] flex items-center justify-center text-[#1a1716] font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium">Administrator</p>
            <p className="text-xs text-[#8b7355]">Ritual Master</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-[#d4a373] text-[#1a1716] font-bold' : 'text-[#8b7355] hover:bg-white/5 hover:text-[#f5f5f5]'
        }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
