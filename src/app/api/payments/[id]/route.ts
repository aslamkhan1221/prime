import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: { payments: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const remainingPayments = payment.invoice.payments.filter((p) => p.id !== params.id);
    const newPaidAmount = remainingPayments.reduce((acc, p) => acc + p.amount, 0);
    const newBalanceAmount = Math.max(0, payment.invoice.grandTotal - newPaidAmount);

    let newStatus = 'DRAFT';
    if (newPaidAmount >= payment.invoice.grandTotal && payment.invoice.grandTotal > 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    } else if (payment.invoice.dueDate < new Date()) {
      newStatus = 'OVERDUE';
    } else {
      newStatus = 'SENT';
    }

    await prisma.$transaction([
      prisma.payment.delete({
        where: { id: params.id },
      }),
      prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Payment deleted and invoice balance recalculated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
