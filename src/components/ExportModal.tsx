'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { FieldDef } from '@/lib/import-export-definitions';
import { exportToSpreadsheet, generateSampleTemplate } from '@/lib/excel-utils';
import { useToast } from '@/components/Toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  data: any[];
  filteredData?: any[];
  defaultFilename: string;
  entityName: string; // e.g. "Items" or "Customers"
}

export function ExportModal({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
  data,
  filteredData,
  defaultFilename,
  entityName,
}: ExportModalProps) {
  const { success, error: toastError } = useToast();

  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [useFilteredData, setUseFilteredData] = useState(false);
  const [filename, setFilename] = useState(
    `${defaultFilename}_${new Date().toISOString().split('T')[0]}`
  );

  // Field selection state: keys of selected fields
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    fields.forEach((f) => {
      if (f.defaultIncluded !== false) {
        initial.add(f.key);
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const recordsToExport = useFilteredData && filteredData ? filteredData : data;
  const isAllSelected = selectedFieldKeys.size === fields.length;
  const isNoneSelected = selectedFieldKeys.size === 0;

  const toggleField = (key: string) => {
    setSelectedFieldKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set<string>();
    fields.forEach((f) => next.add(f.key));
    setSelectedFieldKeys(next);
  };

  const deselectAll = () => {
    setSelectedFieldKeys(new Set<string>());
  };

  const resetToDefault = () => {
    const next = new Set<string>();
    fields.forEach((f) => {
      if (f.defaultIncluded !== false) next.add(f.key);
    });
    setSelectedFieldKeys(next);
  };

  const handleExport = () => {
    try {
      const activeFields = fields.filter((f) => selectedFieldKeys.has(f.key));
      if (activeFields.length === 0) {
        toastError('Please select at least one field to export.');
        return;
      }

      exportToSpreadsheet({
        data: recordsToExport,
        selectedFields: activeFields,
        filename: filename.trim() || defaultFilename,
        format,
        sheetTitle: entityName,
      });

      success(`Exported ${recordsToExport.length} ${entityName} successfully!`);
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Export failed');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const activeFields = fields.filter((f) => selectedFieldKeys.has(f.key));
      if (activeFields.length === 0) {
        toastError('Please select at least one field for the template.');
        return;
      }

      generateSampleTemplate({
        selectedFields: activeFields,
        filename: `${defaultFilename}_sample_template`,
        format,
        sheetTitle: `${entityName} Template`,
      });

      success(`Sample ${format.toUpperCase()} template downloaded!`);
    } catch (err: any) {
      toastError(err.message || 'Template generation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl border border-brand-100">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500">
                {subtitle || `Export ${recordsToExport.length} records with customized fields`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition text-left ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    format === 'xlsx'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    Excel Spreadsheet (.xlsx)
                    {format === 'xlsx' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Recommended. Formatted columns, auto-width, rich formatting.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition text-left ${
                  format === 'csv'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    format === 'csv'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    CSV Text File (.csv)
                    {format === 'csv' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Universal comma-separated format for accounting or CRM imports.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Export Scope & Filename */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Records to Include
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseFilteredData(false)}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    !useFilteredData
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All ({data.length})
                </button>
                {filteredData && filteredData.length !== data.length && (
                  <button
                    type="button"
                    onClick={() => setUseFilteredData(true)}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                      useFilteredData
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Current Filter ({filteredData.length})
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                File Name
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="export_filename"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-l-xl text-slate-800 focus:outline-none focus:border-brand-500 font-mono"
                />
                <span className="px-3 py-2 bg-slate-100 border-y border-r border-slate-200 rounded-r-xl text-xs font-mono text-slate-500">
                  .{format}
                </span>
              </div>
            </div>
          </div>

          {/* Field Selection (Customizable) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Select Fields to Include
                </label>
                <p className="text-[11px] text-slate-500">
                  Customize which columns appear in your exported file
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 bg-brand-50 text-brand-700 font-bold rounded-full text-[11px] border border-brand-200">
                  {selectedFieldKeys.size} / {fields.length} selected
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-[11px] font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={resetToDefault}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Recommended Default
              </button>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {fields.map((f) => {
                const isSelected = selectedFieldKeys.has(f.key);
                return (
                  <label
                    key={f.key}
                    onClick={() => toggleField(f.key)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-white border border-brand-200 shadow-xs'
                        : 'hover:bg-slate-100 border border-transparent opacity-75'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="truncate">{f.label}</span>
                        {f.required && (
                          <span className="text-[10px] text-rose-500 font-bold">*</span>
                        )}
                      </div>
                      {f.description && (
                        <p className="text-[10px] text-slate-500 truncate">{f.description}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition w-full sm:w-auto justify-center"
            title="Download an empty template with sample rows using these selected columns"
          >
            <FileCheck className="w-4 h-4 text-brand-600" />
            <span>Download Sample Template</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isNoneSelected}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export {recordsToExport.length} Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
