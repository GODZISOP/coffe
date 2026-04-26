
interface HeaderProps {
  activeTab: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export const Header = ({ activeTab, onRefresh, onLogout }: HeaderProps) => {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-10">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-medium capitalize">{activeTab}</h2>
        <button
          onClick={onRefresh}
          className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-[#8b7355] transition-colors"
        >
          REFRESH DATA
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-xs text-[#4caf50]">
          <div className="w-2 h-2 rounded-full bg-[#4caf50] animate-pulse" />
          SYSTEM LIVE
        </span>
        <button
          onClick={onLogout}
          className="text-[10px] text-[#8b7355] hover:text-white uppercase tracking-widest ml-4"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
