import React, { useState } from 'react';
import { Loader } from '../components/ui/Loader';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<any>;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0c] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1a1716] p-10 rounded-2xl border border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-[0.2em] text-[#d4a373]">BREW</h1>
          <p className="text-xs tracking-[0.3em] text-[#8b7355] mt-2 uppercase">Ritual Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#d4a373] outline-none transition-colors"
              placeholder="admin@brew.coffee"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#8b7355] uppercase tracking-widest mb-2">Secret Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#d4a373] outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4a373] text-[#1a1716] font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER PORTAL'}
          </button>
        </form>
      </div>
    </div>
  );
};
