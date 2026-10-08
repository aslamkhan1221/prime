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

  return (
    <aside className="w-64 shrink-0 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 no-print z-30 select-none">
      <div>
        {/* Prime Sublimation Logo Badge */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {/* Logo Splash Emblem matching attachment */}
            <div className="relative w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg shadow-brand-500/10 shrink-0">
              <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-amber-400 border border-slate-950 shadow-sm" />
              <div className="absolute -top-1.5 right-1 w-3.5 h-3.5 rounded-full bg-magenta-500 border border-slate-950 shadow-sm" />
              <div className="absolute top-1 -right-1 w-3 h-3 rounded-full bg-brand-400 border border-slate-950 shadow-sm" />
              <Printer className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="font-black text-sm tracking-tight text-white uppercase">
                PRIME <span className="text-brand-400">SUBLIMATION</span>
              </h1>
              <p className="text-[9px] font-bold text-magenta-400 uppercase tracking-wider mt-0.5">
                PRINT EVERYTHING YOU WANT
              </p>
            </div>
          </div>
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-brand-200" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 font-bold flex items-center justify-center text-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Prime Admin'}</p>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-500/20 text-brand-400 rounded">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@primesublimation.in'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
