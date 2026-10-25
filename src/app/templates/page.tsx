'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  AlignJustify,
  FileSpreadsheet,
  Table as TableIcon,
  Sigma,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Info,
  Check,
  RotateCcw,
  Save,
  X,
  Upload,
  Printer,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  FileCheck,
  Building,
  Sliders,
  Eye,
  QrCode,
  Trash2,
} from 'lucide-react';
import {
  InvoiceTemplateConfig,
  DEFAULT_TEMPLATE_CONFIG,
  COLOR_THEMES,
  FONT_OPTIONS,
} from '@/lib/templateConfig';
import { TemplateInvoicePreview } from '@/components/TemplateInvoicePreview';

export type NavTab =
  | 'general'
  | 'headerFooter'
  | 'transaction'
  | 'table'
  | 'total'
  | 'documentSummary'
  | 'other';

function ColorPickerField({
  label,
  value,
  onChange,
  hasCheckbox,
  checked,
  onCheckboxChange,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  hasCheckbox?: boolean;
  checked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-1.5 w-full min-w-0">
      {hasCheckbox ? (
        <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer min-w-0 shrink">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckboxChange && onCheckboxChange(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 shrink-0"
          />
          <span className="truncate">{label}</span>
        </label>
      ) : label ? (
        <span className="font-medium text-slate-700 min-w-0 shrink truncate">{label}</span>
      ) : null}

      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <input
          type="text"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
        />
        <div className="relative w-6 h-6 rounded border border-slate-300 overflow-hidden shrink-0 shadow-sm cursor-pointer hover:border-slate-400">
          <input
            type="color"
            value={value?.startsWith('#') && value.length === 7 ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}


export default function TemplateEditorPage() {
  const router = useRouter();

  // Template configuration state
  const [config, setConfig] = useState<InvoiceTemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('general');
  const [tableSubTab, setTableSubTab] = useState<'labels' | 'layout'>('labels');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Preview zoom scale
  const [previewScale, setPreviewScale] = useState<number>(0.85);

  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    templateProps: true,
    font: false,
    background: false,
    orgDetails: true,
    custDetails: false,
    docDetails: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch initial config from API
  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
        if (data.company) {
          setCompany(data.company);
        }
      } catch (err) {
        console.error('Failed to load template:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplate();
  }, []);

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('prime_template_config', JSON.stringify(config));
      }
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save template configuration');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving template configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply color preset theme
  const applyColorTheme = (themeName: string) => {
    const selected = COLOR_THEMES.find((t) => t.name === themeName);
    if (!selected) return;

    setConfig((prev) => ({
      ...prev,
      themeName: selected.name,
      themeColor: selected.themeColor,
      document: {
        ...prev.document,
        titleColor: selected.titleColor,
      },
      table: {
        ...prev.table,
        headerBgColor: selected.headerBgColor,
        headerTextColor: selected.headerTextColor,
      },
      total: {
        ...prev.total,
        balanceDueColor: selected.balanceDueColor,
      },
    }));
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm('Reset template configuration to Zoho standard defaults?')) {
      setConfig(DEFAULT_TEMPLATE_CONFIG);
    }
  };

  // Helper for updating nested state
  const updateConfig = (path: string, value: any) => {
    setConfig((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Top Action Bar matching Zoho Books Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-20 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Back to Invoices"
          >
            <X className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Edit Template</h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {config.name}
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile View Toggle: Editor vs Preview */}
          <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMobileView('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                mobileView === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                mobileView === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Color Theme Selector Dropdown */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <Palette className="w-4 h-4 text-slate-500" />
            <select
              value={config.themeName || COLOR_THEMES[0].name}
              onChange={(e) => applyColorTheme(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
            >
              {COLOR_THEMES.map((theme) => (
                <option key={theme.name} value={theme.name}>
                  Theme: {theme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Print Test Invoice Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Print Preview / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Refresh Preview / Reset */}
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh Preview</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition transform active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
          </button>

          <Link
            href="/invoices"
            className="hidden sm:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Vertical Icon Ribbon (Zoho Books Tabs) */}
        <aside
          className={`${
            mobileView === 'preview' ? 'hidden md:flex' : 'flex'
          } w-16 sm:w-20 md:w-24 shrink-0 bg-slate-50 border-r border-slate-200 flex-col items-center py-3 sm:py-4 space-y-1.5 sm:space-y-2 select-none overflow-y-auto no-print`}
        >
          {[
            { id: 'general', label: 'General', icon: FileText },
            { id: 'headerFooter', label: 'Header & Footer', icon: AlignJustify },
            { id: 'transaction', label: 'Transaction Details', icon: FileSpreadsheet },
            { id: 'table', label: 'Table', icon: TableIcon },
            { id: 'total', label: 'Total', icon: Sigma },
            { id: 'documentSummary', label: 'Document Summary', icon: FileCheck },
            { id: 'other', label: 'Other Details', icon: MoreHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`w-[58px] sm:w-[72px] md:w-20 py-2 sm:py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-[9px] sm:text-[10px] leading-tight line-clamp-2">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* 2. Middle Configuration Accordion Panel */}
        <div
          className={`${
            mobileView === 'preview' ? 'hidden md:flex' : 'flex'
          } flex-1 md:flex-none md:w-[380px] lg:w-[420px] min-w-0 bg-white border-r border-slate-200 overflow-y-auto overflow-x-hidden flex-col divide-y divide-slate-100 no-print`}
        >
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="divide-y divide-slate-100 text-sm">
              {/* Accordion 1: Template Properties */}
              <div>
                <button
                  onClick={() => toggleSection('templateProps')}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="text-base text-slate-900">Template Properties</span>
                  {openSections.templateProps ? (
                    <ChevronDown className="w-4 h-4 text-brand-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openSections.templateProps && (
                  <div className="p-5 pt-1 space-y-4 bg-white">
                    {/* Template Name */}
                    <div>
                      <label className="block text-xs font-semibold text-rose-600 mb-1">
                        Template Name*
                      </label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => updateConfig('name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        placeholder="Standard Template"
                      />
                    </div>

                    {/* Paper Size */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-2">
                        <span>Paper Size</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-800">
                        {(['A5', 'A4', 'Letter'] as const).map((size) => (
                          <label key={size} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="paperSize"
                              checked={config.paperSize === size}
                              onChange={() => updateConfig('paperSize', size)}
                              className="text-brand-600 focus:ring-brand-500 w-4 h-4"
                            />
                            <span>{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Orientation */}
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-2">Orientation</div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-800">
                        {(['Portrait', 'Landscape'] as const).map((orient) => (
                          <label key={orient} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="orientation"
                              checked={config.orientation === orient}
                              onChange={() => updateConfig('orientation', orient)}
                              className="text-brand-600 focus:ring-brand-500 w-4 h-4"
                            />
                            <span>{orient}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Margins in inches */}
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Margins <span className="text-slate-400 font-normal">(in inches)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(['top', 'bottom', 'left', 'right'] as const).map((dir) => (
                          <div key={dir}>
                            <label className="block text-[11px] text-slate-500 capitalize mb-1">
                              {dir}
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="2"
                              value={config.margins?.[dir] ?? 0.7}
                              onChange={(e) =>
                                updateConfig(`margins.${dir}`, parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-2 py-1.5 text-center text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Font */}
              <div>
                <button
                  onClick={() => toggleSection('font')}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="text-base text-slate-900">Font</span>
                  {openSections.font ? (
                    <ChevronDown className="w-4 h-4 text-brand-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openSections.font && (
                  <div className="p-5 pt-1 space-y-4 bg-white">
                    {/* PDF Font dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        PDF Font
                      </label>
                      <select
                        value={config.font?.family || 'Ubuntu'}
                        onChange={(e) => updateConfig('font.family', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Supports English and Indian regional formatting. Renders standard Indian Rupee symbol (₹).
                      </p>
                    </div>

                    {/* Label Color */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Label Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.font?.labelColor || '#333333'}
                          onChange={(e) => updateConfig('font.labelColor', e.target.value)}
                          className="w-32 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                        <input
                          type="color"
                          value={config.font?.labelColor || '#333333'}
                          onChange={(e) => updateConfig('font.labelColor', e.target.value)}
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>

                    {/* Font Color & Font Size */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Font Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={config.font?.fontColor || '#333333'}
                            onChange={(e) => updateConfig('font.fontColor', e.target.value)}
                            className="w-24 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          />
                          <input
                            type="color"
                            value={config.font?.fontColor || '#333333'}
                            onChange={(e) => updateConfig('font.fontColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Font Size
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="7"
                            max="16"
                            value={config.font?.fontSize || 9}
                            onChange={(e) =>
                              updateConfig('font.fontSize', parseInt(e.target.value) || 9)
                            }
                            className="w-20 px-3 py-1.5 text-xs border border-r-0 border-slate-300 rounded-l-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          />
                          <span className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-r-lg text-xs font-medium text-slate-600">
                            pt
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Background */}
              <div>
                <button
                  onClick={() => toggleSection('background')}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="text-base text-slate-900">Background</span>
                  {openSections.background ? (
                    <ChevronDown className="w-4 h-4 text-brand-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openSections.background && (
                  <div className="p-5 pt-1 space-y-4 bg-white">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Page Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.background?.color || '#ffffff'}
                          onChange={(e) => updateConfig('background.color', e.target.value)}
                          className="w-32 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                        <input
                          type="color"
                          value={config.background?.color || '#ffffff'}
                          onChange={(e) => updateConfig('background.color', e.target.value)}
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.background?.showWatermark || false}
                          onChange={(e) => updateConfig('background.showWatermark', e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>Show Diagonal Watermark</span>
                      </label>

                      {config.background?.showWatermark && (
                        <input
                          type="text"
                          value={config.background?.watermarkText || ''}
                          onChange={(e) => updateConfig('background.watermarkText', e.target.value)}
                          placeholder="e.g. DRAFT or ORIGINAL"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HEADER & FOOTER */}
          {activeTab === 'headerFooter' && (
            <div className="p-5 space-y-5 text-sm">
              <h2 className="text-base font-bold text-slate-900">Header &amp; Footer Properties</h2>

              {/* Header Banner */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.header?.showHeader}
                    onChange={(e) => updateConfig('header.showHeader', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show Top Header Tagline</span>
                </label>
                {config.header?.showHeader && (
                  <input
                    type="text"
                    value={config.header?.bannerText || ''}
                    onChange={(e) => updateConfig('header.bannerText', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="PRINT EVERYTHING YOU WANT"
                  />
                )}
              </div>

              {/* CMYK Stripe */}
              <div className="border border-slate-200 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.header?.showCmykStripe}
                    onChange={(e) => updateConfig('header.showCmykStripe', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show Prime CMYK Color Process Stripe</span>
                </label>
                <div className="cmyk-stripe h-2 w-full rounded-full mt-2.5 opacity-90" />
              </div>

              {/* Footer text & page number */}
              <div className="space-y-3 border border-slate-200 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.footer?.showFooter}
                    onChange={(e) => updateConfig('footer.showFooter', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show Page Footer</span>
                </label>

                {config.footer?.showFooter && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={config.footer?.footerText || ''}
                      onChange={(e) => updateConfig('footer.footerText', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      placeholder="Thank you for your business!"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.footer?.showPageNumber}
                        onChange={(e) => updateConfig('footer.showPageNumber', e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                      />
                      <span>Show Page Number (Page 1 of 1)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTION DETAILS */}
          {activeTab === 'transaction' && (
            <div className="divide-y divide-slate-100 text-sm">
              {/* Accordion 1: Organization Details */}
              <div>
                <button
                  onClick={() => toggleSection('orgDetails')}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="text-base text-slate-900">Organization Details</span>
                  {openSections.orgDetails ? (
                    <ChevronDown className="w-4 h-4 text-brand-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openSections.orgDetails && (
                  <div className="p-5 pt-1 space-y-4 bg-white">
                    {/* Show Organization Logo */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.organization?.showLogo}
                          onChange={(e) => updateConfig('organization.showLogo', e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>Show Organization Logo</span>
                      </label>

                      {config.organization?.showLogo && (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 text-center gap-2">
                          <img
                            src={config.organization.logoUrl || '/logo.png'}
                            alt="Logo preview"
                            className="h-10 w-auto object-contain"
                          />
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload your Files / Default Logo</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show Organization Name */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.organization?.showName}
                          onChange={(e) => updateConfig('organization.showName', e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>Show Organization Name</span>
                      </label>

                      {config.organization?.showName && (
                        <div className="grid grid-cols-2 gap-3 pl-6">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Color</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={config.organization?.nameColor || '#0f172a'}
                                onChange={(e) => updateConfig('organization.nameColor', e.target.value)}
                                className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                              />
                              <input
                                type="color"
                                value={config.organization?.nameColor || '#0f172a'}
                                onChange={(e) => updateConfig('organization.nameColor', e.target.value)}
                                className="w-6 h-6 border rounded cursor-pointer p-0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Font Size</label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="9"
                                max="20"
                                value={config.organization?.nameFontSize || 12}
                                onChange={(e) =>
                                  updateConfig('organization.nameFontSize', parseInt(e.target.value) || 12)
                                }
                                className="w-16 px-2 py-1 text-xs border border-r-0 border-slate-300 rounded-l"
                              />
                              <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600">
                                pt
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show Organization Address & Fields */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.organization?.showAddress}
                          onChange={(e) => updateConfig('organization.showAddress', e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>Show Organization Address</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                        {[
                          { key: 'showPhone', label: 'Phone Number' },
                          { key: 'showEmail', label: 'Email Address' },
                          { key: 'showWebsite', label: 'Website URL' },
                          { key: 'showGstin', label: 'Company GSTIN' },
                          { key: 'showPan', label: 'Company PAN' },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(config.organization as any)?.[item.key]}
                              onChange={(e) =>
                                updateConfig(`organization.${item.key}`, e.target.checked)
                              }
                              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Customer Details */}
              <div>
                <button
                  onClick={() => toggleSection('custDetails')}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="text-base text-slate-900">Customer Details</span>
                  {openSections.custDetails ? (
                    <ChevronDown className="w-4 h-4 text-brand-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openSections.custDetails && (
                  <div className="p-5 pt-1 space-y-3 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bill To Label
                        </label>
                        <input
                          type="text"
                          value={config.customer?.billToLabel || 'Bill To'}
                          onChange={(e) => updateConfig('customer.billToLabel', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ship To Label
                        </label>
                        <input
                          type="text"
                          value={config.customer?.shipToLabel || 'Ship To'}
                          onChange={(e) => updateConfig('customer.shipToLabel', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {[
                        { key: 'showCompanyName', label: 'Show Customer Business Name' },
                        { key: 'showName', label: 'Show Contact Person Name' },
                        { key: 'showBillingAddress', label: 'Show Billing Address' },
                        { key: 'showShippingAddress', label: 'Show Shipping Address' },
                        { key: 'showGstin', label: 'Show Customer GSTIN' },
                        { key: 'showPhone', label: 'Show Customer Phone' },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(config.customer as any)?.[item.key]}
                            onChange={(e) => updateConfig(`customer.${item.key}`, e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Document Details */}
              <div>
                <button
                  onClick={() => toggleSection('docDetails')}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="text-base text-slate-900">Document Details</span>
                  {openSections.docDetails ? (
                    <ChevronDown className="w-4 h-4 text-brand-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openSections.docDetails && (
                  <div className="p-5 pt-1 space-y-4 bg-white">
                    {/* Show Document Title */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.document?.showTitle}
                          onChange={(e) => updateConfig('document.showTitle', e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>Show Document Title</span>
                      </label>

                      {config.document?.showTitle && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={config.document?.title || ''}
                            onChange={(e) => updateConfig('document.title', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            placeholder="TAX INVOICE"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Font Size
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="16"
                                  max="42"
                                  value={config.document?.titleFontSize || 26}
                                  onChange={(e) =>
                                    updateConfig(
                                      'document.titleFontSize',
                                      parseInt(e.target.value) || 26
                                    )
                                  }
                                  className="w-16 px-2 py-1 text-xs border border-r-0 border-slate-300 rounded-l"
                                />
                                <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600">
                                  pt
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Font Color
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={config.document?.titleColor || '#000000'}
                                  onChange={(e) =>
                                    updateConfig('document.titleColor', e.target.value)
                                  }
                                  className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                                />
                                <input
                                  type="color"
                                  value={config.document?.titleColor || '#000000'}
                                  onChange={(e) =>
                                    updateConfig('document.titleColor', e.target.value)
                                  }
                                  className="w-6 h-6 border rounded cursor-pointer p-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Information checkboxes with custom labels */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-xs font-semibold text-slate-800">
                        Document Information
                      </div>

                      {[
                        { key: 'number', defaultLabel: '#' },
                        { key: 'date', defaultLabel: 'Invoice Date' },
                        { key: 'dueDate', defaultLabel: 'Due Date' },
                        { key: 'reference', defaultLabel: 'Reference#' },
                        { key: 'salesperson', defaultLabel: 'Salesperson' },
                        { key: 'project', defaultLabel: 'Project' },
                        { key: 'subject', defaultLabel: 'Subject' },
                      ].map((f) => {
                        const fieldData = (config.document?.fields as any)?.[f.key] || {
                          show: true,
                          label: f.defaultLabel,
                        };
                        return (
                          <div key={f.key} className="flex items-center gap-3">
                            <label className="w-32 flex items-center gap-2 text-xs text-slate-700 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={fieldData.show}
                                onChange={(e) =>
                                  updateConfig(`document.fields.${f.key}.show`, e.target.checked)
                                }
                                className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                              />
                              <span className="capitalize">{f.key} Field</span>
                            </label>
                            <input
                              type="text"
                              value={fieldData.label}
                              onChange={(e) =>
                                updateConfig(`document.fields.${f.key}.label`, e.target.value)
                              }
                              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                              placeholder={f.defaultLabel}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TABLE */}
          {activeTab === 'table' && (
            <div className="p-4 sm:p-5 space-y-4 text-sm min-w-0">
              <h2 className="text-base font-bold text-slate-900">Table Properties</h2>

              {/* Sub-tabs: Labels | Layout */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setTableSubTab('labels')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    tableSubTab === 'labels'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Labels
                </button>
                <button
                  onClick={() => setTableSubTab('layout')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    tableSubTab === 'layout'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Layout
                </button>
              </div>

              {tableSubTab === 'labels' ? (
                <div className="space-y-3">
                  {/* Table Column Configuration matching Screenshot 5 */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-bold text-slate-600 border-b border-slate-200">
                      <div className="col-span-4">FIELD</div>
                      <div className="col-span-3 text-center">WIDTH(%)</div>
                      <div className="col-span-5">LABEL</div>
                    </div>

                    <div className="divide-y divide-slate-100 p-1">
                      {[
                        { key: 'itemNumber', name: 'Line Item Number', hasWidth: true },
                        { key: 'item', name: 'Item', hasWidth: true },
                        { key: 'customFields', name: 'Custom Fields', hasWidth: true },
                        { key: 'quantity', name: 'Quantity', hasWidth: true },
                        { key: 'rate', name: 'Rate', hasWidth: true },
                        { key: 'taxPercent', name: 'Tax (%)', hasWidth: true },
                        { key: 'taxAmount', name: 'Tax Amount', hasWidth: true },
                        { key: 'discount', name: 'Discount', hasWidth: true },
                        { key: 'amount', name: 'Amount', hasWidth: true },
                      ].map((col) => {
                        const colData = (config.table?.columns as any)?.[col.key] || {
                          show: true,
                          width: 10,
                          label: col.name,
                        };
                        return (
                          <div key={col.key} className="grid grid-cols-12 items-center p-2 gap-2">
                            {/* Checkbox & Field Name */}
                            <label className="col-span-4 flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={colData.show}
                                onChange={(e) =>
                                  updateConfig(`table.columns.${col.key}.show`, e.target.checked)
                                }
                                className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                              />
                              <span className="truncate">{col.name}</span>
                            </label>

                            {/* Width % */}
                            <div className="col-span-3 text-center">
                              {col.hasWidth && (
                                <input
                                  type="number"
                                  min="1"
                                  max="80"
                                  value={colData.width || 10}
                                  onChange={(e) =>
                                    updateConfig(
                                      `table.columns.${col.key}.width`,
                                      parseInt(e.target.value) || 10
                                    )
                                  }
                                  className="w-16 px-2 py-1 text-center text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                                />
                              )}
                            </div>

                            {/* Label */}
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={colData.label || ''}
                                onChange={(e) =>
                                  updateConfig(`table.columns.${col.key}.label`, e.target.value)
                                }
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add tax to amount */}
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={config.table?.addTaxToAmount}
                      onChange={(e) => updateConfig('table.addTaxToAmount', e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                    />
                    <span>Add tax to amount</span>
                  </label>
                </div>
              ) : (
                /* Layout sub-tab matching 1st Image */
                <div className="space-y-4 pt-1">
                  {/* Table Border */}
                  <div className="pb-3 border-b border-slate-100">
                    <ColorPickerField
                      label="Table Border"
                      hasCheckbox={true}
                      checked={config.table?.showTableBorder !== false}
                      onCheckboxChange={(checked) => updateConfig('table.showTableBorder', checked)}
                      value={config.table?.tableBorderColor || '#adadad'}
                      onChange={(val) => updateConfig('table.tableBorderColor', val)}
                    />
                  </div>

                  {/* Table Header Section */}
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900">Table Header</div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium text-slate-700">Font Size</span>
                      <div className="flex items-center shrink-0 ml-auto">
                        <input
                          type="number"
                          min="7"
                          max="16"
                          value={config.table?.headerFontSize || 9}
                          onChange={(e) =>
                            updateConfig('table.headerFontSize', parseInt(e.target.value) || 9)
                          }
                          className="w-14 px-2 py-1 text-center text-xs border border-r-0 border-slate-300 rounded-l font-mono"
                        />
                        <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600 shrink-0">
                          pt
                        </span>
                      </div>
                    </div>

                    <ColorPickerField
                      label="Background Color"
                      hasCheckbox={true}
                      checked={config.table?.showHeaderBgColor !== false}
                      onCheckboxChange={(checked) =>
                        updateConfig('table.showHeaderBgColor', checked)
                      }
                      value={config.table?.headerBgColor || '#3c3d3a'}
                      onChange={(val) => updateConfig('table.headerBgColor', val)}
                    />

                    <ColorPickerField
                      label="Font Color"
                      value={config.table?.headerTextColor || '#ffffff'}
                      onChange={(val) => updateConfig('table.headerTextColor', val)}
                    />
                  </div>

                  {/* Item Row Section */}
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900">Item Row</div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium text-slate-700">Font Size</span>
                      <div className="flex items-center shrink-0 ml-auto">
                        <input
                          type="number"
                          min="7"
                          max="16"
                          value={config.table?.rowFontSize || 9}
                          onChange={(e) =>
                            updateConfig('table.rowFontSize', parseInt(e.target.value) || 9)
                          }
                          className="w-14 px-2 py-1 text-center text-xs border border-r-0 border-slate-300 rounded-l font-mono"
                        />
                        <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600 shrink-0">
                          pt
                        </span>
                      </div>
                    </div>

                    <ColorPickerField
                      label="Background Color"
                      hasCheckbox={true}
                      checked={config.table?.showRowBgColor || false}
                      onCheckboxChange={(checked) =>
                        updateConfig('table.showRowBgColor', checked)
                      }
                      value={config.table?.rowBgColor || '#ffffff'}
                      onChange={(val) => updateConfig('table.rowBgColor', val)}
                    />

                    <ColorPickerField
                      label="Font Color"
                      value={config.table?.rowTextColor || '#000000'}
                      onChange={(val) => updateConfig('table.rowTextColor', val)}
                    />
                  </div>

                  {/* Item Description Section */}
                  <div className="space-y-2 pb-1">
                    <div className="font-bold text-xs text-slate-900">Item Description</div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium text-slate-700">Font Size</span>
                      <div className="flex items-center shrink-0 ml-auto">
                        <input
                          type="number"
                          min="6"
                          max="14"
                          value={config.table?.descFontSize || 8}
                          onChange={(e) =>
                            updateConfig('table.descFontSize', parseInt(e.target.value) || 8)
                          }
                          className="w-14 px-2 py-1 text-center text-xs border border-r-0 border-slate-300 rounded-l font-mono"
                        />
                        <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600 shrink-0">
                          pt
                        </span>
                      </div>
                    </div>

                    <ColorPickerField
                      label="Font Color"
                      value={config.table?.descTextColor || '#333333'}
                      onChange={(val) => updateConfig('table.descTextColor', val)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TOTAL */}
          {activeTab === 'total' && (
            <div className="p-5 space-y-4 text-sm">
              <h2 className="text-base font-bold text-slate-900">Total Properties</h2>

              <div className="space-y-3">
                {[
                  { key: 'showSubtotal', labelKey: 'subtotalLabel', title: 'Sub Total' },
                  { key: 'showDiscount', labelKey: 'discountLabel', title: 'Discount Total' },
                  { key: 'showTaxBreakdown', labelKey: 'taxBreakdownLabel', title: 'Tax Breakdown' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <label className="w-36 flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={(config.total as any)?.[item.key]}
                        onChange={(e) => updateConfig(`total.${item.key}`, e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span>{item.title}</span>
                    </label>
                    <input
                      type="text"
                      value={(config.total as any)?.[item.labelKey] || ''}
                      onChange={(e) => updateConfig(`total.${item.labelKey}`, e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded"
                    />
                  </div>
                ))}

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={config.total?.showRoundOff}
                    onChange={(e) => updateConfig('total.showRoundOff', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>Show Round Off</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.total?.showTotalInWords}
                    onChange={(e) => updateConfig('total.showTotalInWords', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>Show Total In Words</span>
                </label>

                {/* Balance Due */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.total?.showBalanceDue}
                      onChange={(e) => updateConfig('total.showBalanceDue', e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                    />
                    <span>Show Balance Due</span>
                  </label>

                  {config.total?.showBalanceDue && (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-xs text-slate-500">Color:</span>
                      <input
                        type="text"
                        value={config.total?.balanceDueColor || '#00a3e0'}
                        onChange={(e) => updateConfig('total.balanceDueColor', e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                      />
                      <input
                        type="color"
                        value={config.total?.balanceDueColor || '#00a3e0'}
                        onChange={(e) => updateConfig('total.balanceDueColor', e.target.value)}
                        className="w-6 h-6 border rounded cursor-pointer p-0"
                      />
                    </div>
                  )}
                </div>

                {/* Signature */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.total?.showSignature}
                      onChange={(e) => updateConfig('total.showSignature', e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                    />
                    <span>Show Authorized Signature</span>
                  </label>

                  {config.total?.showSignature && (
                    <input
                      type="text"
                      value={config.total?.signatureLabel || ''}
                      onChange={(e) => updateConfig('total.signatureLabel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                      placeholder="Authorized Signature for Prime Print & Services"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENT SUMMARY (Matching 4th Image) */}
          {activeTab === 'documentSummary' && (
            <div className="p-5 space-y-4 text-sm divide-y divide-slate-100">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-base font-bold text-slate-900">Document Summary</h2>
                <ChevronDown className="w-4 h-4 text-brand-600" />
              </div>

              {/* Notes */}
              <div className="pt-3 space-y-3">
                <div className="font-bold text-xs text-slate-900">Notes</div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                    <input
                      type="text"
                      value={config.documentSummary?.notesLabel ?? config.other?.notesLabel ?? 'Notes'}
                      onChange={(e) => updateConfig('documentSummary.notesLabel', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                      placeholder="Notes"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="font-medium text-slate-700">Font Size</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="6"
                        max="16"
                        value={config.documentSummary?.notesFontSize ?? 8}
                        onChange={(e) => updateConfig('documentSummary.notesFontSize', parseInt(e.target.value) || 8)}
                        className="w-16 px-2 py-1 text-xs border border-r-0 border-slate-300 rounded-l font-mono"
                      />
                      <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600">pt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Options & UPI QR Code */}
              <div className="pt-3 space-y-3">
                <div className="font-bold text-xs text-slate-900">Payment Options</div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.documentSummary?.showOnlinePaymentLink ?? true}
                      onChange={(e) => updateConfig('documentSummary.showOnlinePaymentLink', e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                    />
                    <span>Online Payment Link</span>
                  </label>
                  <input
                    type="text"
                    value={config.documentSummary?.onlinePaymentLinkLabel ?? 'Payment Options'}
                    onChange={(e) => updateConfig('documentSummary.onlinePaymentLinkLabel', e.target.value)}
                    className="w-40 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                    placeholder="Payment Options"
                  />
                </div>

                {/* UPI Payment QR Code Card in Document Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.other?.showUpiQr}
                        onChange={(e) => updateConfig('other.showUpiQr', e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-brand-600" />
                        Show UPI Payment QR Code
                      </span>
                    </label>
                    {(config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('other.upiQrImageUrl', '');
                          updateConfig('documentSummary.upiQrImageUrl', '');
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  {config.other?.showUpiQr && (
                    <>
                      {(config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl) ? (
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            <img
                              src={config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl}
                              alt="Uploaded UPI QR Code"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              UPI QR Code Uploaded
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Reflecting live on invoice
                            </div>
                            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                              <Upload className="w-3 h-3" />
                              <span>Change QR Image</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                      alert('File size exceeds 2MB limit');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const url = reader.result as string;
                                      updateConfig('other.upiQrImageUrl', url);
                                      updateConfig('documentSummary.upiQrImageUrl', url);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/20 bg-white rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                            <Upload className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            Upload UPI QR Code Image
                          </div>
                          <div className="text-[10px] text-slate-400">
                            PNG, JPG, WebP, SVG up to 2MB
                          </div>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('File size exceeds 2MB limit');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const url = reader.result as string;
                                  updateConfig('other.upiQrImageUrl', url);
                                  updateConfig('documentSummary.upiQrImageUrl', url);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </>
                  )}

                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>⚙ Add / Edit Bank Account Details</span>
                  </Link>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="pt-3 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.documentSummary?.showTerms ?? true}
                    onChange={(e) => updateConfig('documentSummary.showTerms', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>Terms &amp; Conditions</span>
                </label>

                {(config.documentSummary?.showTerms ?? true) && (
                  <div className="space-y-2 pl-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                      <input
                        type="text"
                        value={config.documentSummary?.termsLabel ?? config.other?.termsLabel ?? 'Terms & Conditions'}
                        onChange={(e) => updateConfig('documentSummary.termsLabel', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        placeholder="Terms & Conditions"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium text-slate-700">Font Size</span>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="6"
                          max="16"
                          value={config.documentSummary?.termsFontSize ?? 8}
                          onChange={(e) => updateConfig('documentSummary.termsFontSize', parseInt(e.target.value) || 8)}
                          className="w-16 px-2 py-1 text-xs border border-r-0 border-slate-300 rounded-l font-mono"
                        />
                        <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-r text-[11px] text-slate-600">pt</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="pt-3 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.documentSummary?.showSignature ?? true}
                    onChange={(e) => updateConfig('documentSummary.showSignature', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  <span>Signature</span>
                </label>

                {(config.documentSummary?.showSignature ?? true) && (
                  <div className="space-y-3 pl-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                      <input
                        type="text"
                        value={config.documentSummary?.signatureLabel ?? 'Authorized Signature'}
                        onChange={(e) => updateConfig('documentSummary.signatureLabel', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        placeholder="Authorized Signature"
                      />
                    </div>

                    {/* Signature image upload matching Screenshot 4 */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Signature Image</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-4 text-center bg-slate-50/50 transition">
                        {config.documentSummary?.signatureImageUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={config.documentSummary.signatureImageUrl}
                              alt="Signature"
                              className="max-h-16 w-auto object-contain border border-slate-200 rounded p-1 bg-white"
                            />
                            <button
                              onClick={() => updateConfig('documentSummary.signatureImageUrl', '')}
                              className="text-[11px] text-rose-600 font-semibold hover:underline"
                            >
                              Remove signature image
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-bold text-slate-800">
                              Drag and drop or <span className="text-brand-600 underline">Upload file</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Maximum size: 1 MB<br />
                              Supported Formats: PNG, JPEG, JPG, BMP
                            </div>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/bmp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) {
                                    alert('File size exceeds 1MB limit');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    updateConfig('documentSummary.signatureImageUrl', reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Signature Name</label>
                      <input
                        type="text"
                        value={config.documentSummary?.signatureName ?? ''}
                        onChange={(e) => updateConfig('documentSummary.signatureName', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                        placeholder="e.g. Authorized Signatory for Prime Print"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={config.documentSummary?.additionalSignature ?? false}
                        onChange={(e) => updateConfig('documentSummary.additionalSignature', e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span>Additional Signature</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Annexure Accordion */}
              <div className="pt-3">
                <button
                  onClick={() => updateConfig('documentSummary.showAnnexure', !config.documentSummary?.showAnnexure)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-slate-900 py-1"
                >
                  <span>Annexure</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition transform ${config.documentSummary?.showAnnexure ? 'rotate-90' : ''}`} />
                </button>
                {config.documentSummary?.showAnnexure && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    Annexure pages can be attached to provide extended item specifications, work order scopes, or legal terms.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: OTHER DETAILS */}
          {activeTab === 'other' && (
            <div className="p-5 space-y-4 text-sm">
              <h2 className="text-base font-bold text-slate-900">Other Details Properties</h2>

              {/* Notes */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.other?.showNotes}
                    onChange={(e) => updateConfig('other.showNotes', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show Notes</span>
                </label>

                {config.other?.showNotes && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={config.other?.notesLabel || 'Notes'}
                      onChange={(e) => updateConfig('other.notesLabel', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded font-semibold"
                    />
                    <textarea
                      rows={3}
                      value={config.other?.defaultNotes || ''}
                      onChange={(e) => updateConfig('other.defaultNotes', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.other?.showTerms}
                    onChange={(e) => updateConfig('other.showTerms', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show Terms &amp; Conditions</span>
                </label>

                {config.other?.showTerms && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={config.other?.termsLabel || 'Terms & Conditions'}
                      onChange={(e) => updateConfig('other.termsLabel', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded font-semibold"
                    />
                    <textarea
                      rows={4}
                      value={config.other?.defaultTerms || ''}
                      onChange={(e) => updateConfig('other.defaultTerms', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Bank Details & QR */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.other?.showBankDetails}
                    onChange={(e) => updateConfig('other.showBankDetails', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show Bank Account Details in Invoice</span>
                </label>

                {/* UPI QR Code Section with Upload Option */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.other?.showUpiQr}
                      onChange={(e) => {
                        updateConfig('other.showUpiQr', e.target.checked);
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-brand-600" />
                      Show UPI Payment QR Code
                    </span>
                  </label>

                  {config.other?.showUpiQr && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          UPI QR Code Image
                        </span>
                        {(config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl) && (
                          <button
                            type="button"
                            onClick={() => {
                              updateConfig('other.upiQrImageUrl', '');
                              updateConfig('documentSummary.upiQrImageUrl', '');
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      {(config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl) ? (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            <img
                              src={config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl}
                              alt="Uploaded UPI QR Code"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              QR Code Uploaded
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Reflecting live on invoice
                            </div>
                            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer pt-1">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Change QR Image</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                      alert('File size exceeds 2MB limit');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const url = reader.result as string;
                                      updateConfig('other.upiQrImageUrl', url);
                                      updateConfig('documentSummary.upiQrImageUrl', url);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/20 bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                          <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            Upload UPI QR Code Image
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            PNG, JPG, WebP, SVG up to 2MB
                          </div>
                          <div className="text-[10px] text-brand-600 font-medium mt-1">
                            GPay, PhonePe, Paytm, BHIM or Bank QR
                          </div>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('File size exceeds 2MB limit');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const url = reader.result as string;
                                  updateConfig('other.upiQrImageUrl', url);
                                  updateConfig('documentSummary.upiQrImageUrl', url);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}

                      {/* Optional UPI ID text */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          UPI ID / VPA (Optional display text)
                        </label>
                        <input
                          type="text"
                          value={config.other?.upiId || ''}
                          onChange={(e) => {
                            updateConfig('other.upiId', e.target.value);
                          }}
                          placeholder="e.g. yourbusiness@okhdfcbank"
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Right Interactive Real-Time Live Preview Sheet */}
        <main
          className={`${
            mobileView === 'editor' ? 'hidden md:flex' : 'flex'
          } flex-1 min-w-0 bg-slate-200/80 overflow-auto flex-col items-center p-3 sm:p-6 select-auto`}
        >
          {/* Preview toolbar */}
          <div className="w-full max-w-[850px] mb-4 flex items-center justify-between text-xs text-slate-600 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-300 shadow-sm no-print">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">Live Preview</span>
              <span className="text-slate-400">| Changes update instantly</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewScale((s) => Math.max(0.5, s - 0.1))}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] w-12 text-center">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                onClick={() => setPreviewScale((s) => Math.min(1.3, s + 0.1))}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewScale(0.85)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Scaled Printable Preview Paper */}
          <div className="overflow-visible pb-24 print:p-0 print:m-0">
            <TemplateInvoicePreview
              config={config}
              company={company}
              scale={previewScale}
              isPrintMode={true}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
