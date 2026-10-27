import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: {
            customer: true,
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: { payments: true },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment receipt not found' }, { status: 404 });
    }

    const newAmount = Number(body.amount !== undefined ? body.amount : existingPayment.amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
    }

    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : existingPayment.paymentDate;
    const paymentMethod = body.paymentMethod || existingPayment.paymentMethod;
    const referenceNumber = body.referenceNumber !== undefined ? (body.referenceNumber?.trim() || null) : existingPayment.referenceNumber;
    const notes = body.notes !== undefined ? (body.notes?.trim() || null) : existingPayment.notes;
    const paymentNumber = body.paymentNumber ? body.paymentNumber.trim() : existingPayment.paymentNumber;

    // Check paymentNumber uniqueness if it was changed
    if (paymentNumber !== existingPayment.paymentNumber) {
      const duplicate = await prisma.payment.findUnique({ where: { paymentNumber } });
      if (duplicate && duplicate.id !== params.id) {
        return NextResponse.json({ error: `Receipt number "${paymentNumber}" is already in use.` }, { status: 400 });
      }
    }

    const targetInvoiceId = body.invoiceId || existingPayment.invoiceId;

    if (targetInvoiceId === existingPayment.invoiceId) {
      // Same invoice
      const invoice = existingPayment.invoice;
      const otherPayments = invoice.payments.filter((p) => p.id !== params.id);
      const newPaidAmount = otherPayments.reduce((acc, p) => acc + p.amount, 0) + newAmount;
      const newBalanceAmount = Math.max(0, invoice.grandTotal - newPaidAmount);

      let newStatus = 'DRAFT';
      if (newPaidAmount >= invoice.grandTotal && invoice.grandTotal > 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      } else if (new Date(invoice.dueDate) < new Date()) {
        newStatus = 'OVERDUE';
      } else {
        newStatus = 'SENT';
      }

      const [updatedPayment] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: params.id },
          data: {
            paymentNumber,
            amount: newAmount,
            paymentDate,
            paymentMethod,
            referenceNumber,
            notes,
          },
          include: {
            invoice: {
              include: { customer: true },
            },
          },
        }),
        prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
          },
        }),
      ]);

      return NextResponse.json({ success: true, payment: updatedPayment });
    } else {
      // Reassigning to a different invoice
      const newInvoice = await prisma.invoice.findUnique({
        where: { id: targetInvoiceId },
        include: { payments: true },
      });

      if (!newInvoice) {
        return NextResponse.json({ error: 'Target invoice not found' }, { status: 404 });
      }

      // Old invoice recalculation
      const oldInvoice = existingPayment.invoice;
      const oldRemainingPayments = oldInvoice.payments.filter((p) => p.id !== params.id);
      const oldPaidAmount = oldRemainingPayments.reduce((acc, p) => acc + p.amount, 0);
      const oldBalanceAmount = Math.max(0, oldInvoice.grandTotal - oldPaidAmount);

      let oldStatus = 'DRAFT';
      if (oldPaidAmount >= oldInvoice.grandTotal && oldInvoice.grandTotal > 0) {
        oldStatus = 'PAID';
      } else if (oldPaidAmount > 0) {
        oldStatus = 'PARTIALLY_PAID';
      } else if (new Date(oldInvoice.dueDate) < new Date()) {
        oldStatus = 'OVERDUE';
      } else {
        oldStatus = 'SENT';
      }

      // New invoice recalculation
      const newPaidAmount = newInvoice.payments.reduce((acc, p) => acc + p.amount, 0) + newAmount;
      const newBalanceAmount = Math.max(0, newInvoice.grandTotal - newPaidAmount);

      let newStatus = 'DRAFT';
      if (newPaidAmount >= newInvoice.grandTotal && newInvoice.grandTotal > 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      } else if (new Date(newInvoice.dueDate) < new Date()) {
        newStatus = 'OVERDUE';
      } else {
        newStatus = 'SENT';
      }

      const [updatedPayment] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: params.id },
          data: {
            paymentNumber,
            invoiceId: targetInvoiceId,
            amount: newAmount,
            paymentDate,
            paymentMethod,
            referenceNumber,
            notes,
          },
          include: {
            invoice: {
              include: { customer: true },
            },
          },
        }),
        prisma.invoice.update({
          where: { id: oldInvoice.id },
          data: {
            paidAmount: oldPaidAmount,
            balanceAmount: oldBalanceAmount,
            status: oldStatus,
          },
        }),
        prisma.invoice.update({
          where: { id: newInvoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
          },
        }),
      ]);

      return NextResponse.json({ success: true, payment: updatedPayment });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    } else if (new Date(payment.invoice.dueDate) < new Date()) {
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
