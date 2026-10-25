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
} from 'lucide-react';
import {
  InvoiceTemplateConfig,
  DEFAULT_TEMPLATE_CONFIG,
  COLOR_THEMES,
  FONT_OPTIONS,
} from '@/lib/templateConfig';
import { TemplateInvoicePreview } from '@/components/TemplateInvoicePreview';

type NavTab = 'general' | 'headerFooter' | 'transaction' | 'table' | 'total' | 'other';

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
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
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
        <div className="flex items-center gap-3">
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

          {/* Refresh Preview / Reset */}
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh Preview</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition transform active:scale-95 ${
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
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Vertical Icon Ribbon (Zoho Books 6 Tabs) */}
        <aside className="w-20 md:w-24 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 space-y-2 select-none overflow-y-auto">
          {[
            { id: 'general', label: 'General', icon: FileText },
            { id: 'headerFooter', label: 'Header & Footer', icon: AlignJustify },
            { id: 'transaction', label: 'Transaction Details', icon: FileSpreadsheet },
            { id: 'table', label: 'Table', icon: TableIcon },
            { id: 'total', label: 'Total', icon: Sigma },
            { id: 'other', label: 'Other Details', icon: MoreHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`w-[72px] md:w-20 py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] leading-tight line-clamp-2">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* 2. Middle Configuration Accordion Panel */}
        <div className="w-full md:w-[420px] lg:w-[460px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col divide-y divide-slate-100">
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
            <div className="p-5 space-y-4 text-sm">
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
                /* Layout sub-tab */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Header Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={config.table?.headerBgColor || '#00a3e0'}
                        onChange={(e) => updateConfig('table.headerBgColor', e.target.value)}
                        className="w-32 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                      <input
                        type="color"
                        value={config.table?.headerBgColor || '#00a3e0'}
                        onChange={(e) => updateConfig('table.headerBgColor', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Header Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={config.table?.headerTextColor || '#ffffff'}
                        onChange={(e) => updateConfig('table.headerTextColor', e.target.value)}
                        className="w-32 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                      <input
                        type="color"
                        value={config.table?.headerTextColor || '#ffffff'}
                        onChange={(e) => updateConfig('table.headerTextColor', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Table Row Style
                    </label>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-800">
                      {(['grid', 'clean', 'striped'] as const).map((style) => (
                        <label key={style} className="flex items-center gap-2 cursor-pointer capitalize">
                          <input
                            type="radio"
                            name="layoutStyle"
                            checked={config.table?.layoutStyle === style}
                            onChange={() => updateConfig('table.layoutStyle', style)}
                            className="text-brand-600 focus:ring-brand-500 w-4 h-4"
                          />
                          <span>{style}</span>
                        </label>
                      ))}
                    </div>
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

          {/* TAB 6: OTHER DETAILS */}
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

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.other?.showUpiQr}
                    onChange={(e) => updateConfig('other.showUpiQr', e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Show UPI Payment QR Code</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 3. Right Interactive Real-Time Live Preview Sheet */}
        <main className="flex-1 bg-slate-200/80 overflow-auto flex flex-col items-center p-6 select-auto">
          {/* Preview toolbar */}
          <div className="w-full max-w-[850px] mb-4 flex items-center justify-between text-xs text-slate-600 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-300 shadow-sm">
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
          <div className="overflow-visible pb-24">
            <TemplateInvoicePreview
              config={config}
              company={company}
              scale={previewScale}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
