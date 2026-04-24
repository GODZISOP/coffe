import { Loader2 } from 'lucide-react';

export const Loader = ({ size = 40 }: { size?: number }) => (
  <div className="flex items-center justify-center">
    <Loader2 className="animate-spin text-[#d4a373]" size={size} />
  </div>
);
