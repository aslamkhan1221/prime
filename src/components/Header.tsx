'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Bell, Calendar, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  actionIcon?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  actionText,
  actionHref,
  onActionClick,
  actionIcon,
}: HeaderProps) {
  const today = new Date();

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80 no-print">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs font-medium text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/60 rounded-xl text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-brand-400" />
          <span>{formatDate(today)}</span>
        </div>

        {actionText && (
          actionHref ? (
            <Link
              href={actionHref}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
            >
              {actionIcon || <Plus className="w-4 h-4" />}
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
            >
              {actionIcon || <Plus className="w-4 h-4" />}
              <span>{actionText}</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
