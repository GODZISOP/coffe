import React from 'react';
import { HelpCircle, Mail, MessageSquare, Phone } from 'lucide-react';

export const HelpPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#d4a373]/10 rounded-full flex items-center justify-center mx-auto">
          <HelpCircle className="text-[#d4a373]" size={32} />
        </div>
        <h2 className="text-3xl font-bold">Admin Support Center</h2>
        <p className="text-[#8b7355]">How can we help you manage your coffee shop today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1716] p-8 rounded-2xl border border-white/5 space-y-4 hover:border-[#d4a373]/30 transition-colors">
          <div className="w-10 h-10 bg-[#2196f3]/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="text-[#2196f3]" size={20} />
          </div>
          <h3 className="text-xl font-semibold">Live Chat</h3>
          <p className="text-[#8b7355] text-sm leading-relaxed">
            Get instant help from our technical support team regarding order management or system issues.
          </p>
          <button className="text-xs font-bold uppercase tracking-widest text-white border-b border-[#d4a373] pb-1 hover:text-[#d4a373] transition-colors">
            Start Conversation
          </button>
        </div>

        <div className="bg-[#1a1716] p-8 rounded-2xl border border-white/5 space-y-4 hover:border-[#d4a373]/30 transition-colors">
          <div className="w-10 h-10 bg-[#4caf50]/10 rounded-lg flex items-center justify-center">
            <Mail className="text-[#4caf50]" size={20} />
          </div>
          <h3 className="text-xl font-semibold">Email Support</h3>
          <p className="text-[#8b7355] text-sm leading-relaxed">
            Send us detailed reports of any bugs or feature requests. We usually respond within 2 hours.
          </p>
          <button className="text-xs font-bold uppercase tracking-widest text-white border-b border-[#d4a373] pb-1 hover:text-[#d4a373] transition-colors">
            support@brew-admin.com
          </button>
        </div>
      </div>

      <div className="bg-[#1a1716] p-8 rounded-2xl border border-white/5">
        <h3 className="text-lg font-medium mb-6">Frequently Asked Questions</h3>
        <div className="space-y-6">
          {[
            { q: "How do I update the menu?", a: "The Menu Manager is currently under development. Please contact support for manual updates." },
            { q: "What should I do if an order is stuck?", a: "Try refreshing the dashboard. If it persists, use the 'Live Chat' feature for immediate resolution." },
            { q: "Can I manage multiple locations?", a: "Yes, our multi-shop feature is available for Pro accounts. Check your subscription settings." }
          ].map((faq, i) => (
            <div key={i} className="space-y-2">
              <p className="font-medium text-white">{faq.q}</p>
              <p className="text-sm text-[#8b7355]">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
