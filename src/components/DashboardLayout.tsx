'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Menu, X, Sparkles } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>({
    name: 'Prime Admin',
    email: 'primeadmin',
    role: 'ADMIN',
  });
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Auth fetch info:', err);
      }
    }

    checkAuth();
  }, []);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center animate-pulse shadow-xl shadow-brand-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading Prime Studio...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-slate-900 h-full z-10 flex flex-col justify-between shadow-2xl">
            <Sidebar user={user} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white">PRIME STUDIO</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
