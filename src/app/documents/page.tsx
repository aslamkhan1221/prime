'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileImage,
  Eye,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCode,
  HardDrive,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CompanyDoc {
  id: string;
  title: string;
  category: string;
  documentNumber?: string;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  notes?: string;
  expiryDate?: string;
  createdAt?: string;
}

const CATEGORIES = [
  'All',
  'Company Registration & Licenses',
  'GST & Tax Certificates',
  'Banking & Financials',
  'Identity & KYC Documents',
  'Contracts & NDAs',
  'Insurance & Compliance',
  'Other Corporate Documents',
];

export default function DocumentLockerPage() {
  const [documents, setDocuments] = useState<CompanyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CompanyDoc | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[1]);
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFile, setFormFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [fileError, setFileError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/documents', window.location.origin);
      if (selectedCategory && selectedCategory !== 'All') {
        url.searchParams.set('category', selectedCategory);
      }
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size exceeds 15MB limit.');
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      setFormFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result as string,
      });
      if (!formTitle) {
        // Auto-fill title from filename
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setFormTitle(base.replace(/[-_]/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a document title');
      return;
    }
    if (!formFile) {
      alert('Please select or upload a document file');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          category: formCategory,
          documentNumber: formDocNumber.trim(),
          expiryDate: formExpiryDate || null,
          notes: formNotes.trim(),
          fileUrl: formFile.dataUrl,
          fileName: formFile.name,
          fileType: formFile.type,
          fileSize: formFile.size,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsUploadOpen(false);
        resetForm();
        fetchDocuments();
      } else {
        alert(data.error || 'Failed to upload document');
      }
    } catch (err: any) {
      alert('Error uploading document: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory(CATEGORIES[1]);
    setFormDocNumber('');
    setFormExpiryDate('');
    setFormNotes('');
    setFormFile(null);
    setFileError('');
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-8 h-8 text-slate-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-rose-500" />;
    if (fileType.includes('image')) return <FileImage className="w-8 h-8 text-brand-500" />;
    if (fileType.includes('sheet') || fileType.includes('csv') || fileType.includes('excel')) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    }
    return <FileCode className="w-8 h-8 text-slate-400" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isExpired = (expiry?: string) => {
    if (!expiry) return false;
    return new Date(expiry).getTime() < Date.now();
  };

  const isExpiringSoon = (expiry?: string) => {
    if (!expiry) return false;
    const diff = new Date(expiry).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // 30 days
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Company Document Locker"
          description="Securely upload, organize, and access all corporate certificates, tax registrations, KYC documents, and contracts."
          action={
            <button
              onClick={() => {
                resetForm();
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition transform active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          }
        />

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stored</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{documents.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Corporate files secured</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST & Tax Proofs</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {documents.filter((d) => d.category?.includes('Tax') || d.category?.includes('GST')).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Compliant records</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Licenses & Registration</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {documents.filter((d) => d.category?.includes('Registration') || d.category?.includes('Licenses')).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Official authorities</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attention Needed</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {documents.filter((d) => isExpired(d.expiryDate) || isExpiringSoon(d.expiryDate)).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Expired or expiring soon</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search document title, ref#, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
              />
            </form>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-slate-500 font-semibold mt-3">Loading corporate documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Documents in Locker</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Upload your company PAN, GST registration, MSME certificate, Shop Act license, or bank documents to keep them centralized and accessible.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsUploadOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-500 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload First Document</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const expired = isExpired(doc.expiryDate);
              const expiringSoon = isExpiringSoon(doc.expiryDate);

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 max-w-[150px] truncate">
                          {doc.category}
                        </span>
                        {doc.documentNumber && (
                          <span className="text-[10px] font-mono text-slate-500">
                            #{doc.documentNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                      {doc.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {doc.notes}
                        </p>
                      )}
                    </div>

                    {/* Expiry Pill */}
                    {doc.expiryDate && (
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                          expired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : expiringSoon
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {expired ? 'Expired on: ' : expiringSoon ? 'Expiring soon: ' : 'Valid until: '}
                          {doc.expiryDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(doc.fileSize)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        title="View Document"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-white rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName || `${doc.title}.pdf`}
                        title="Download Document"
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        title="Delete Document"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Document / Ref #</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => {
                    const expired = isExpired(doc.expiryDate);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="block">{doc.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {doc.documentNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="py-3 px-4">
                          {doc.expiryDate ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                expired ? 'bg-rose-50 text-rose-700' : 'text-slate-600'
                              }`}
                            >
                              {doc.expiryDate}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName || `${doc.title}.pdf`}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id, doc.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Upload to Document Locker</h3>
                    <p className="text-xs text-slate-500">Add corporate compliance, tax, or legal records</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* File Drop Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Document File (PDF, Image, Scan)*
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      formFile
                        ? 'border-brand-500 bg-brand-50/20'
                        : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,image/*,.doc,.docx"
                      className="hidden"
                    />

                    {formFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-brand-600 shrink-0" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                            {formFile.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatFileSize(formFile.size)} • Click to change file
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          Click to browse or drop file here
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Supports PDF, JPG, PNG, WEBP (Max 15MB)
                        </p>
                      </div>
                    )}
                  </div>
                  {fileError && <p className="text-xs text-rose-600 mt-1">{fileError}</p>}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Title*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GST Registration Certificate REG-06"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category*</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Document / Registration #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAACP1234F1Z5"
                      value={formDocNumber}
                      onChange={(e) => setFormDocNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Expiry Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expiry Date (if applicable)
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notes / Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief remarks or renewal reminder"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save to Locker'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    {previewDoc.category} {previewDoc.documentNumber ? `• #${previewDoc.documentNumber}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName || `${previewDoc.title}.pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-900/5 p-4 overflow-auto flex items-center justify-center min-h-[450px]">
                {previewDoc.fileType?.includes('image') ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200"
                  />
                ) : (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.title}
                    className="w-full h-[70vh] rounded-xl border border-slate-300 bg-white"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
