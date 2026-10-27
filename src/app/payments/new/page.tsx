'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ZohoPaymentForm } from '@/components/ZohoPaymentForm';

function PaymentNewContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId') || '';

  return (
    <div className="py-2">
      <ZohoPaymentForm initialInvoiceId={invoiceId} />
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading payment form...</div>}>
        <PaymentNewContent />
      </Suspense>
    </DashboardLayout>
  );
}
