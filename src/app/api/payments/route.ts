import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { referenceNumber: { contains: search } },
        { invoice: { invoiceNumber: { contains: search } } },
        { invoice: { customer: { name: { contains: search } } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                companyName: true,
                pan: true,
                gstin: true,
                email: true,
                mobile: true,
                billingAddress: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Payment number: either user provided or auto generated
    let paymentNumber = body.paymentNumber ? String(body.paymentNumber).trim() : '';
    if (!paymentNumber) {
      const count = await prisma.payment.count();
      paymentNumber = `${count + 1}`;
    }

    // Check uniqueness of paymentNumber
    const existingNum = await prisma.payment.findUnique({ where: { paymentNumber } });
    if (existingNum) {
      const count = await prisma.payment.count();
      paymentNumber = `PAY-${1001 + count}`;
    }

    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();
    const paymentReceivedOn = body.paymentReceivedOn ? new Date(body.paymentReceivedOn) : null;
    const isDraft = body.status === 'DRAFT';
    const status = isDraft ? 'DRAFT' : 'PAID';

    // Calculate new paid amount and balance if paid
    let newPaidAmount = invoice.paidAmount;
    let newBalanceAmount = invoice.balanceAmount;
    let newStatus = invoice.status;

    if (!isDraft) {
      const existingPaid = invoice.payments
        .filter((p: any) => (p as any).status !== 'DRAFT')
        .reduce((acc, p) => acc + p.amount, 0);
      newPaidAmount = existingPaid + amount;
      newBalanceAmount = Math.max(0, invoice.grandTotal - newPaidAmount);

      if (newBalanceAmount <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      }
    }

    const bankCharges = body.bankCharges !== undefined ? Number(body.bankCharges) || 0 : 0;
    const tdsDeducted = Boolean(body.tdsDeducted);
    const depositTo = body.depositTo ? String(body.depositTo).trim() : 'Petty Cash';
    const attachments = body.attachments
      ? typeof body.attachments === 'string'
        ? body.attachments
        : JSON.stringify(body.attachments)
      : null;

    // Transaction to create payment and update invoice
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentNumber,
          invoiceId: body.invoiceId,
          amount,
          paymentDate,
          paymentMethod: body.paymentMethod || 'Cash',
          referenceNumber: body.referenceNumber?.trim() || null,
          notes: body.notes?.trim() || null,
          bankCharges,
          tdsDeducted,
          paymentReceivedOn,
          depositTo,
          status,
          attachments,
        } as any,
      }),
      prisma.invoice.update({
        where: { id: body.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      }),
    ]);

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
