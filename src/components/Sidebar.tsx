'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  FileText,
  CreditCard,
  Receipt,
  UserCheck,
  BarChart3,
  Settings,
  Printer,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export const ALL_NAV_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'customers', name: 'CRM / Customers', href: '/customers', icon: Users },
  { id: 'items', name: 'Items & Catalog', href: '/items', icon: Package },
  { id: 'orders', name: 'Orders', href: '/orders', icon: ShoppingBag },
  { id: 'invoices', name: 'Invoices', href: '/invoices', icon: FileText },
  { id: 'payments', name: 'Payments', href: '/payments', icon: CreditCard },
  { id: 'expenses', name: 'Expenses', href: '/expenses', icon: Receipt },
  { id: 'partners', name: 'Partners & Profit', href: '/partners', icon: UserCheck },
  { id: 'reports', name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
  { id: 'settings', name: 'Company Settings', href: '/settings', icon: Settings },
];

export function Sidebar({
  user,
}: {
  user?: { name: string; email: string; role: string; permissions?: string[] | null } | null;
}) {
  const pathname = usePathname();

  // If user has role PARTNER and custom permissions, filter the sidebar menu items
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (!user || user.role === 'ADMIN' || user.role === 'MANAGER') return true;
    if (user.role === 'PARTNER') {
      if (Array.isArray(user.permissions) && user.permissions.length > 0) {
        return user.permissions.includes(item.id);
      }
      // Default partner allowed items if no specific permissions
      return ['dashboard', 'orders', 'invoices', 'reports'].includes(item.id);
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 no-print z-30 select-none shadow-sm">
      <div>
        {/* Prime Print & Services Official Logo Banner */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <Link href="/dashboard" className="block group">
            <div className="p-1 flex items-center justify-center transition-all group-hover:scale-[1.02]">
              <img
                src="/logo.png"
                alt="Prime Print & Services - Print Everything You Want"
                className="w-full h-auto max-h-14 object-contain"
              />
            </div>
          </Link>
          {/* CMYK 4-stripe bar from logo */}
          <div className="cmyk-stripe h-1 w-full rounded-full mt-3 opacity-90 shadow-sm" />
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20 font-bold border-l-4 border-magenta-500'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-3.5 border-t border-slate-200/90 bg-slate-50/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Prime Admin'}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-50 text-brand-600 border border-brand-200 rounded">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'primeadmin'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
