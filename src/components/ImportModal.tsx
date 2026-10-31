'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Eye,
  RefreshCw,
  FileCheck,
  CheckSquare,
  Square,
  AlertTriangle,
  HelpCircle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { FieldDef } from '@/lib/import-export-definitions';
import {
  parseSpreadsheetFile,
  autoMapColumns,
  generateSampleTemplate,
  ParsedSpreadsheet,
} from '@/lib/excel-utils';
import { useToast } from '@/components/Toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  endpointUrl: string; // e.g. '/api/items/import' or '/api/customers/import'
  entityName: string; // e.g. 'Items' or 'Customers'
  onSuccess: () => void;
}

type Step = 'UPLOAD' | 'MAP_FIELDS' | 'PREVIEW' | 'RESULT';

interface ColumnMapping {
  fileHeader: string;
  selectedFieldKey: string; // key of FieldDef or '' if skipped
  isIncluded: boolean; // user can toggle whether to import this field
  sampleValues: any[];
}

export function ImportModal({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
  endpointUrl,
  entityName,
  onSuccess,
}: ImportModalProps) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSpreadsheet | null>(null);
  const [parsing, setParsing] = useState(false);

  // Column mappings state
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [conflictMode, setConflictMode] = useState<'skip' | 'update' | 'create_always'>('skip');

  // Preview row exclusions (index of rows to exclude)
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(new Set());

  // Execution state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep('UPLOAD');
    setFile(null);
    setParsedData(null);
    setColumnMappings([]);
    setExcludedRowIndices(new Set());
    setImportResult(null);
    setImporting(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleFileSelected = async (selectedFile: File) => {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValid = validExts.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      toastError('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setParsing(true);
    setFile(selectedFile);

    try {
      const parsed = await parseSpreadsheetFile(selectedFile);
      setParsedData(parsed);

      // Auto-detect column mappings
      const autoMap = autoMapColumns(parsed.headers, fields);

      const initialMappings: ColumnMapping[] = parsed.headers.map((header) => {
        const mappedKey = autoMap[header] || '';
        const samples = parsed.rawRows
          .slice(0, 2)
          .map((row) => row[header])
          .filter((v) => v !== undefined && v !== '');

        return {
          fileHeader: header,
          selectedFieldKey: mappedKey,
          isIncluded: Boolean(mappedKey), // If auto-matched, mark as included by default
          sampleValues: samples,
        };
      });

      setColumnMappings(initialMappings);
      setStep('MAP_FIELDS');
      success(`Parsed ${parsed.totalRows} rows from ${selectedFile.name}`);
    } catch (err: any) {
      toastError(err.message || 'Failed to read spreadsheet');
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Field mapping toggles & changes
  const toggleColumnIncluded = (index: number) => {
    setColumnMappings((prev) => {
      const next = [...prev];
      const target = next[index];
      const newIncluded = !target.isIncluded;
      next[index] = {
        ...target,
        isIncluded: newIncluded,
        selectedFieldKey: newIncluded ? (target.selectedFieldKey || '') : '',
      };
      return next;
    });
  };

  const updateColumnMapping = (index: number, newKey: string) => {
    setColumnMappings((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        selectedFieldKey: newKey,
        isIncluded: newKey !== '', // if unmapped, toggle off
      };
      return next;
    });
  };

  const selectAllColumns = () => {
    setColumnMappings((prev) =>
      prev.map((m) => ({
        ...m,
        isIncluded: true,
      }))
    );
  };

  const deselectAllColumns = () => {
    setColumnMappings((prev) =>
      prev.map((m) => ({
        ...m,
        isIncluded: false,
        selectedFieldKey: '',
      }))
    );
  };

  const reAutoMatch = () => {
    if (!parsedData) return;
    const autoMap = autoMapColumns(parsedData.headers, fields);
    setColumnMappings((prev) =>
      prev.map((m) => {
        const mappedKey = autoMap[m.fileHeader] || '';
        return {
          ...m,
          selectedFieldKey: mappedKey,
          isIncluded: Boolean(mappedKey),
        };
      })
    );
  };

  // Build transformed records ready for preview and submission
  const activeMappings = columnMappings.filter((m) => m.isIncluded && m.selectedFieldKey);
  const activeFieldsCount = activeMappings.length;
  const skippedFieldsCount = columnMappings.length - activeFieldsCount;

  // Check required field (e.g. name)
  const requiredField = fields.find((f) => f.required);
  const isRequiredFieldMapped = !requiredField || activeMappings.some((m) => m.selectedFieldKey === requiredField.key);

  const buildMappedRows = (): (Record<string, any> & { _index: number; _raw: Record<string, any> })[] => {
    if (!parsedData) return [];
    return parsedData.rawRows.map((rawRow, idx) => {
      const mappedObj: Record<string, any> = {};
      activeMappings.forEach((mapping) => {
        mappedObj[mapping.selectedFieldKey] = rawRow[mapping.fileHeader];
      });
      return {
        _index: idx,
        _raw: rawRow,
        ...mappedObj,
      };
    });
  };

  const mappedRows = buildMappedRows();

  const handleStartImport = async () => {
    if (activeMappings.length === 0) {
      toastError('Please select and map at least one field to import.');
      return;
    }

    if (!isRequiredFieldMapped && requiredField) {
      toastError(`Required field "${requiredField.label}" is not mapped.`);
      return;
    }

    const rowsToSend = mappedRows
      .filter((row) => !excludedRowIndices.has(row._index))
      .map(({ _index, _raw, ...rest }) => rest);

    if (rowsToSend.length === 0) {
      toastError('No valid rows selected for import.');
      return;
    }

    setImporting(true);
    setStep('RESULT');

    try {
      const payloadKey = entityName.toLowerCase().includes('customer') ? 'customers' : 'items';
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [payloadKey]: rowsToSend,
          conflictMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import request failed');

      setImportResult({
        total: data.total ?? rowsToSend.length,
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors || [],
      });

      success(`Successfully processed ${data.created + data.updated} ${entityName}!`);
      onSuccess();
    } catch (err: any) {
      toastError(err.message || 'Error occurred during import');
      setImportResult({
        total: rowsToSend.length,
        created: 0,
        updated: 0,
        skipped: rowsToSend.length,
        errors: [err.message || 'Unknown network error'],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = (format: 'xlsx' | 'csv' = 'xlsx') => {
    generateSampleTemplate({
      selectedFields: fields.filter((f) => f.defaultIncluded !== false),
      filename: `${entityName.toLowerCase()}_sample_template`,
      format,
      sheetTitle: `${entityName} Template`,
    });
    success(`Sample ${format.toUpperCase()} template downloaded!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl border border-brand-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                  Step{' '}
                  {step === 'UPLOAD'
                    ? '1 of 3: Upload'
                    : step === 'MAP_FIELDS'
                    ? '2 of 3: Customize Fields'
                    : step === 'PREVIEW'
                    ? '3 of 3: Preview'
                    : 'Complete'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {subtitle || `Import ${entityName} from Excel or CSV with custom field mappings`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Multi-step */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD */}
          {step === 'UPLOAD' && (
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/60 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-sm border border-brand-100">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Click or drag Excel / CSV file here
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-3">
                  Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono">.xlsx</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono">.csv</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono">.xls</span>
                </div>
              </div>

              {parsing && (
                <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                  <span>Reading spreadsheet columns and data...</span>
                </div>
              )}

              {/* Sample Template Helper */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Need a Sample Import Template?</h4>
                    <p className="text-[11px] text-slate-500">
                      Download pre-formatted sample files with all standard fields and example rows to get started quickly.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('xlsx')}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition flex items-center gap-1.5"
                    title="Download Excel format (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('csv')}
                    className="px-3 py-1.5 bg-white hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition flex items-center gap-1.5"
                    title="Download CSV format (.csv)"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOMIZE FIELDS & MAP COLUMNS */}
          {step === 'MAP_FIELDS' && parsedData && (
            <div className="space-y-5">
              {/* Top Banner with Stats */}
              <div className="bg-gradient-to-r from-brand-50 to-sky-50 border border-brand-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-600 text-white rounded-lg shadow-sm">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Customize Fields to Import
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Choose which fields from <strong className="font-semibold">{file?.name}</strong> to import.
                      Toggle any column on or off.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                  <span className="px-2.5 py-1 bg-white font-bold rounded-lg border border-brand-200 text-brand-700 shadow-xs">
                    {activeFieldsCount} / {columnMappings.length} Fields to Import
                  </span>
                  {skippedFieldsCount > 0 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px]">
                      {skippedFieldsCount} Skipped
                    </span>
                  )}
                </div>
              </div>

              {/* Warning if Required field not mapped */}
              {!isRequiredFieldMapped && requiredField && (
                <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <strong>Required Field Missing:</strong> Please map at least one column to{' '}
                    <span className="underline font-bold">{requiredField.label}</span>.
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition"
                  >
                    Select All Columns
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllColumns}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={reAutoMatch}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Auto-Match Names
                  </button>
                </div>

                <span className="text-[11px] text-slate-500">
                  {parsedData.totalRows} data rows detected in file
                </span>
              </div>

              {/* Column Mapping Table / List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="grid grid-cols-12 bg-slate-100/80 px-4 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <div className="col-span-1 text-center">Import</div>
                  <div className="col-span-4">File Column & Samples</div>
                  <div className="col-span-1 text-center">→</div>
                  <div className="col-span-6">Map to System Field</div>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {columnMappings.map((col, index) => {
                    const isMapped = Boolean(col.selectedFieldKey);
                    const matchedField = fields.find((f) => f.key === col.selectedFieldKey);

                    return (
                      <div
                        key={col.fileHeader}
                        className={`grid grid-cols-12 items-center px-4 py-3 transition ${
                          col.isIncluded
                            ? 'bg-white hover:bg-slate-50/80'
                            : 'bg-slate-50/50 opacity-60'
                        }`}
                      >
                        {/* Import Checkbox */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleColumnIncluded(index)}
                            className="p-1 text-slate-500 hover:text-brand-600 transition"
                            title={col.isIncluded ? 'Click to skip this field' : 'Click to include this field'}
                          >
                            {col.isIncluded ? (
                              <CheckSquare className="w-4 h-4 text-brand-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </div>

                        {/* File Column & Samples */}
                        <div className="col-span-4 pr-2">
                          <div className="text-xs font-bold text-slate-800 font-mono truncate" title={col.fileHeader}>
                            {col.fileHeader}
                          </div>
                          {col.sampleValues.length > 0 ? (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5" title={col.sampleValues.join(', ')}>
                              e.g.: &quot;{String(col.sampleValues[0])}&quot;
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">Empty sample</div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="col-span-1 text-center text-slate-400 text-xs">
                          →
                        </div>

                        {/* Target System Field Dropdown */}
                        <div className="col-span-6">
                          <select
                            value={col.selectedFieldKey}
                            onChange={(e) => updateColumnMapping(index, e.target.value)}
                            disabled={!col.isIncluded}
                            className={`w-full px-3 py-1.5 text-xs rounded-xl border transition focus:outline-none focus:border-brand-500 ${
                              !col.isIncluded
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : isMapped
                                ? 'bg-white text-slate-900 border-brand-300 font-medium'
                                : 'bg-amber-50/50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="">-- Do Not Import (Skip Column) --</option>
                            {fields.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} {f.required ? '(* Required)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conflict Resolution Strategy */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Duplicate & Conflict Resolution
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    onClick={() => setConflictMode('skip')}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      conflictMode === 'skip'
                        ? 'bg-white border-brand-500 shadow-xs'
                        : 'bg-transparent border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={conflictMode === 'skip'}
                      onChange={() => setConflictMode('skip')}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Skip Duplicates</div>
                      <p className="text-[10px] text-slate-500">Keep existing record untouched</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setConflictMode('update')}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      conflictMode === 'update'
                        ? 'bg-white border-brand-500 shadow-xs'
                        : 'bg-transparent border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={conflictMode === 'update'}
                      onChange={() => setConflictMode('update')}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Update Existing</div>
                      <p className="text-[10px] text-slate-500">Overwrite matched with file data</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setConflictMode('create_always')}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      conflictMode === 'create_always'
                        ? 'bg-white border-brand-500 shadow-xs'
                        : 'bg-transparent border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={conflictMode === 'create_always'}
                      onChange={() => setConflictMode('create_always')}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Always Add As New</div>
                      <p className="text-[10px] text-slate-500">Create new record regardless</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VERIFY */}
          {step === 'PREVIEW' && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Data Preview (First {Math.min(mappedRows.length, 10)} rows)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Showing mapped fields only. Uncheck any row to exclude it from the import.
                  </p>
                </div>

                <div className="text-xs font-bold text-brand-600">
                  {mappedRows.length - excludedRowIndices.size} of {mappedRows.length} rows selected
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        {activeMappings.map((m) => {
                          const f = fields.find((fld) => fld.key === m.selectedFieldKey);
                          return (
                            <th key={m.selectedFieldKey} className="py-2.5 px-3 whitespace-nowrap">
                              {f?.label || m.selectedFieldKey}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {mappedRows.slice(0, 10).map((row) => {
                        const isExcluded = excludedRowIndices.has(row._index);
                        return (
                          <tr
                            key={row._index}
                            className={`hover:bg-slate-50 transition ${
                              isExcluded ? 'opacity-40 bg-slate-50/80 line-through' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={() => {
                                  setExcludedRowIndices((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(row._index)) {
                                      next.delete(row._index);
                                    } else {
                                      next.add(row._index);
                                    }
                                    return next;
                                  });
                                }}
                                className="rounded text-brand-600 focus:ring-0"
                              />
                            </td>
                            {activeMappings.map((m) => {
                              const cellVal = row[m.selectedFieldKey];
                              return (
                                <td key={m.selectedFieldKey} className="py-2.5 px-3 whitespace-nowrap max-w-xs truncate">
                                  {cellVal !== undefined && cellVal !== '' ? (
                                    String(cellVal)
                                  ) : (
                                    <span className="text-slate-300 italic">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {mappedRows.length > 10 && (
                <p className="text-[11px] text-slate-400 text-center">
                  + {mappedRows.length - 10} more rows will be imported
                </p>
              )}
            </div>
          )}

          {/* STEP 4: RESULT / PROGRESS */}
          {step === 'RESULT' && (
            <div className="py-8 text-center space-y-4">
              {importing ? (
                <div className="space-y-3">
                  <div className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <h3 className="text-base font-bold text-slate-900">
                    Importing {entityName}...
                  </h3>
                  <p className="text-xs text-slate-500">
                    Processing rows and writing to database. Please wait a moment.
                  </p>
                </div>
              ) : importResult ? (
                <div className="space-y-5">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Import Completed!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Processed {importResult.total} rows from {file?.name}
                    </p>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                      <div className="text-xl font-black text-emerald-700">{importResult.created}</div>
                      <div className="text-[11px] font-semibold text-emerald-800">New Created</div>
                    </div>
                    <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-center">
                      <div className="text-xl font-black text-sky-700">{importResult.updated}</div>
                      <div className="text-[11px] font-semibold text-sky-800">Updated</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xl font-black text-slate-700">{importResult.skipped}</div>
                      <div className="text-[11px] font-semibold text-slate-600">Skipped</div>
                    </div>
                  </div>

                  {/* Errors / Warnings List if any */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-3 max-w-lg mx-auto text-xs text-amber-900 max-h-40 overflow-y-auto">
                      <div className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Notices & Skipped Records ({importResult.errors.length})</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 font-mono">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          {step === 'UPLOAD' ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">Accepts .xlsx, .xls, .csv</span>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          ) : step === 'MAP_FIELDS' ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to File</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep('PREVIEW')}
                  disabled={activeFieldsCount === 0 || (!isRequiredFieldMapped && Boolean(requiredField))}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
                >
                  <span>Preview Data ({activeFieldsCount} fields)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : step === 'PREVIEW' ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setStep('MAP_FIELDS')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Fields</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={mappedRows.length - excludedRowIndices.size === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Start Import ({mappedRows.length - excludedRowIndices.size} rows)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/30 transition"
              >
                Done & Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
