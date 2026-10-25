'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import {
  Receipt,
  Plus,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function VendorCreditsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  // Vendor credits sample list
  const [credits, setCredits] = useState<any[]>([
    
  ]);

  const filteredCredits = credits.filter(
    (c) =>
      c.creditNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOpenCredits = credits
    .filter((c) => c.status === 'OPEN')
    .reduce((sum, c) => sum + c.balance, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Vendor Credits"
          description="Manage supplier credit notes, material return credits, and vendor rebate balances."
          action={
            <button
              onClick={() => {
                const credNum = `VC-${String(credits.length + 13).padStart(5, '0')}`;
                const vendor = prompt('Vendor Name:');
                if (!vendor) return;
                const amt = Number(prompt('Credit Amount (₹):') || 0);
                if (!amt) return;
                const reason = prompt('Reason for credit / return:') || 'Vendor adjustment';
                setCredits([
                  {
                    id: 'vc_' + Date.now(),
                    creditNumber: credNum,
                    vendorName: vendor,
                    date: new Date().toISOString(),
                    reference: 'ADJ-' + Math.floor(1000 + Math.random() * 9000),
                    amount: amt,
                    balance: amt,
                    status: 'OPEN',
                    reason,
                  },
                  ...credits,
                ]);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Vendor Credit</span>
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Credits</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalOpenCredits)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Usable against next purchase</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Notes</p>
              <p className="text-2xl font-black text-brand-600 mt-1">
                {credits.filter((c) => c.status === 'OPEN').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pending bills to offset</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Credit Notes</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{credits.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Lifetime supplier adjustments</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search credit#, vendor, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Credit Note #</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Reference / Reason</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Credit Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCredits.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.creditNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.vendorName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{c.reference}</span>
                      <span className="text-[10px] text-slate-500">{c.reason}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(c.date)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(c.balance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
