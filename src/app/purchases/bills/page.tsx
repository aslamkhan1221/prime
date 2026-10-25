'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    // Bills can be converted from Purchase Orders or entered directly
    async function load() {
      try {
        const res = await fetch('/api/purchases/orders');
        const data = await res.json();
        if (data.success && data.orders) {
          // Show POs that have status ISSUED or BILLED as bills reference
          const mapped = data.orders.map((po: any) => ({
            id: 'bill_' + po.id,
            billNumber: 'BILL-' + po.poNumber?.replace('PO-', ''),
            poNumber: po.poNumber,
            vendorName: po.vendorName || po.vendorCompany || 'Vendor',
            billDate: po.orderDate,
            dueDate: po.deliveryDate || po.orderDate,
            amount: po.total || 0,
            status: po.status === 'RECEIVED' ? 'PAID' : 'OPEN',
          }));
          setBills(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredBills = bills.filter((b) => {
    const matchSearch =
      b.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.poNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalBillAmount = filteredBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Vendor Bills"
          description="Track incoming vendor bills, accounts payable, and procurement invoices."
          action={
            <Link
              href="/purchases/orders/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Bill</span>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payable</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalBillAmount)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{filteredBills.length} recorded bills</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Bills</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {bills.filter((b) => b.status === 'OPEN').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting disbursement</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Bills</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {bills.filter((b) => b.status === 'PAID').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cleared invoices</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bill#, vendor, or PO#..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-auto text-xs">
            {['ALL', 'OPEN', 'PAID'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No vendor bills found</p>
              <p className="text-xs text-slate-500 mt-1">
                Bills will appear here as you create Purchase Orders or record vendor invoices.
              </p>
              <Link
                href="/purchases/orders/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-500 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Purchase Order</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bill #</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Source PO</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {bill.billNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{bill.vendorName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-brand-600">
                        <Link href="/purchases/orders" className="hover:underline">
                          {bill.poNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(bill.billDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-300'
                          }`}
                        >
                          {bill.status}
                        </span>
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
