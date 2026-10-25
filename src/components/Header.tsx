'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Bell, Calendar, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  secondaryActionIcon?: React.ReactNode;
  action?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  description,
  actionText,
  actionHref,
  onActionClick,
  actionIcon,
  secondaryActionText,
  secondaryActionHref,
  secondaryActionIcon,
  action,
}: HeaderProps) {
  const today = new Date();
  const sub = subtitle || description;

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 mb-6 border-b border-slate-200 no-print">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          <span className="cmyk-stripe h-1.5 w-8 rounded-full opacity-80 shrink-0" />
        </div>
        {sub && <p className="text-xs font-medium text-slate-500 mt-1">{sub}</p>}
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
        {action ? (
          action
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>{formatDate(today)}</span>
            </div>

            {secondaryActionText && secondaryActionHref && (
              <Link
                href={secondaryActionHref}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold rounded-xl shadow-sm transition transform active:scale-95"
              >
                {secondaryActionIcon}
                <span>{secondaryActionText}</span>
              </Link>
            )}

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
          </>
        )}
      </div>
    </header>
  );
}
