
export const StatCard = ({ title, value, icon }: any) => {
  return (
    <div className="bg-[#1a1716] p-8 rounded-2xl border border-white/5 flex items-center justify-between">
      <div>
        <p className="text-sm text-[#8b7355] mb-2">{title}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>
      <div className="p-4 bg-white/5 rounded-xl">{icon}</div>
    </div>
  );
};
