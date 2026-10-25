'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, LayoutTemplate } from 'lucide-react';
import { InvoiceTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/lib/templateConfig';
import { TemplateInvoicePreview } from '@/components/TemplateInvoicePreview';

interface InvoicePrintViewProps {
  invoice: any;
  settings: any;
  onBack?: () => void;
}

function parseTemplateConfig(raw: any): InvoiceTemplateConfig {
  if (!raw) return DEFAULT_TEMPLATE_CONFIG;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      ...DEFAULT_TEMPLATE_CONFIG,
      ...parsed,
      margins: { ...DEFAULT_TEMPLATE_CONFIG.margins, ...(parsed.margins || {}) },
      font: { ...DEFAULT_TEMPLATE_CONFIG.font, ...(parsed.font || {}) },
      background: { ...DEFAULT_TEMPLATE_CONFIG.background, ...(parsed.background || {}) },
      header: { ...DEFAULT_TEMPLATE_CONFIG.header, ...(parsed.header || {}) },
      footer: { ...DEFAULT_TEMPLATE_CONFIG.footer, ...(parsed.footer || {}) },
      organization: { ...DEFAULT_TEMPLATE_CONFIG.organization, ...(parsed.organization || {}) },
      customer: { ...DEFAULT_TEMPLATE_CONFIG.customer, ...(parsed.customer || {}) },
      document: {
        ...DEFAULT_TEMPLATE_CONFIG.document,
        ...(parsed.document || {}),
        fields: { ...DEFAULT_TEMPLATE_CONFIG.document.fields, ...(parsed.document?.fields || {}) },
      },
      table: {
        ...DEFAULT_TEMPLATE_CONFIG.table,
        ...(parsed.table || {}),
        columns: { ...DEFAULT_TEMPLATE_CONFIG.table.columns, ...(parsed.table?.columns || {}) },
      },
      total: { ...DEFAULT_TEMPLATE_CONFIG.total, ...(parsed.total || {}) },
      documentSummary: { ...DEFAULT_TEMPLATE_CONFIG.documentSummary, ...(parsed.documentSummary || {}) },
      other: { ...DEFAULT_TEMPLATE_CONFIG.other, ...(parsed.other || {}) },
    };
  } catch {
    return DEFAULT_TEMPLATE_CONFIG;
  }
}

export function InvoicePrintView({ invoice, settings, onBack }: InvoicePrintViewProps) {
  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig>(() => {
    // 1. Try instant cache from localStorage if updated in template editor
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('prime_template_config');
        if (cached) return parseTemplateConfig(JSON.parse(cached));
      } catch {}
    }
    // 2. Fall back to settings passed from server
    return parseTemplateConfig(settings?.templateConfig);
  });

  // Background fetch to guarantee latest saved template properties are applied
  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data?.config) {
          setTemplateConfig(parseTemplateConfig(data.config));
          try {
            localStorage.setItem('prime_template_config', JSON.stringify(data.config));
          } catch {}
        }
      })
      .catch((err) => console.error('Failed to sync latest template config:', err));
  }, []);

  // Update if settings prop changes
  useEffect(() => {
    if (settings?.templateConfig) {
      setTemplateConfig(parseTemplateConfig(settings.templateConfig));
    }
  }, [settings?.templateConfig]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-sm font-bold text-slate-900">
            Invoice #{invoice.invoiceNumber}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              invoice.status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : invoice.status === 'PARTIALLY_PAID'
                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                : invoice.status === 'OVERDUE'
                ? 'bg-rose-50 text-rose-700 border border-rose-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {invoice.status?.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/templates"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-brand-600" />
            <span>Customize Template</span>
          </Link>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="flex justify-center print:block">
        <TemplateInvoicePreview
          config={templateConfig}
          company={settings}
          invoice={invoice}
          scale={1}
          isPrintMode={true}
        />
      </div>
    </div>
  );
}
