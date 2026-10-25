'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Building2,
  Calendar,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsMadePage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Fetch from expenses and orders to show supplier payments made
        const res = await fetch('/api/expenses');
        const data = await res.json();
        if (data.success && data.expenses) {
          const supplierPayments = data.expenses
            .filter((e: any) => e.category === 'Cost of Goods Sold' || e.category === 'Raw Materials' || e.category === 'Vendor' || e.category === 'General')
            .map((e: any, idx: number) => ({
              id: e.id,
              paymentNumber: `PMT-${String(idx + 101).padStart(5, '0')}`,
              vendorName: e.title || 'Raw Material Supplier',
              paymentDate: e.date,
              amount: e.amount,
              paymentMethod: e.paymentMethod || 'BANK_TRANSFER',
              referenceNumber: e.referenceNumber || `UTR-${e.id.substring(0, 8).toUpperCase()}`,
            }));
          setPayments(supplierPayments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredPayments = payments.filter((p) =>
    p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDisbursed = filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Payments Made"
          description="Record disbursements, bank transfers, and payouts made to material vendors and suppliers."
          action={
            <Link
              href="/expenses"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Vendor Payment</span>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Disbursed</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalDisbursed)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supplier payouts cleared</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{filteredPayments.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Payment receipts issued</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Modes</p>
              <p className="text-2xl font-black text-slate-900 mt-1">NEFT / UPI</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct bank transfer</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, payment#, or UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading payments made...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No Payments Made Recorded</p>
              <p className="text-xs text-slate-500 mt-1">
                Record supplier disbursements to maintain real-time vendor ledger balances.
              </p>
              <Link
                href="/expenses"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-500 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Expense / Payment</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Payment #</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mode / Reference</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {pmt.paymentNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pmt.vendorName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(pmt.paymentDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block">
                          {pmt.paymentMethod?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {pmt.referenceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatCurrency(pmt.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
