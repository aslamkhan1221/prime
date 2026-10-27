'use client';

import React from 'react';
import { ZohoPaymentForm } from './ZohoPaymentForm';
import { X } from 'lucide-react';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any | null;
  onSuccess: (updatedPayment: any) => void;
}

export function EditPaymentModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: EditPaymentModalProps) {
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 text-sm">Edit Payment Receipt #{payment.paymentNumber}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <ZohoPaymentForm
            paymentIdToEdit={payment.id}
            isModal={true}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
}
