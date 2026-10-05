import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/calculations';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        order: true,
        items: {
          include: {
            item: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const settings = await prisma.companySetting.findUnique({ where: { id: 'default' } });

    return NextResponse.json({ invoice, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // Existing invoice to check payments
    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { payments: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const calculatedItems = body.items.map((item: any) => {
      const calc = calculateLineItem({
        pricingType: item.pricingType || 'QTY_RATE',
        unit: item.unit || 'PIECE',
        width: item.width ? Number(item.width) : null,
        height: item.height ? Number(item.height) : null,
        quantity: item.quantity ? Number(item.quantity) : 1,
        area: item.area ? Number(item.area) : null,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) ?? 18.0,
      });

      return {
        itemId: item.itemId || null,
        name: item.name || 'Custom Design Item',
        description: item.description || null,
        unit: item.unit || 'PIECE',
        pricingType: item.pricingType || 'QTY_RATE',
        width: item.width ? Number(item.width) : null,
        height: item.height ? Number(item.height) : null,
        quantity: Number(item.quantity) || 1,
        area: calc.computedArea > 0 ? calc.computedArea : item.area ? Number(item.area) : null,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) ?? 18.0,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
      };
    });

    const totals = calculateDocumentTotals(
      calculatedItems.map((ci: any) => ({
        pricingType: ci.pricingType,
        unit: ci.unit,
        width: ci.width,
        height: ci.height,
        quantity: ci.quantity,
        area: ci.area,
        rate: ci.rate,
        discount: ci.discount,
        taxRate: ci.taxRate,
      }))
    );

    const paidSum = existing.payments.reduce((acc, p) => acc + p.amount, 0);
    const balanceAmount = Math.max(0, totals.grandTotal - paidSum);

    let calculatedStatus = body.status || existing.status;
    if (paidSum >= totals.grandTotal && totals.grandTotal > 0) {
      calculatedStatus = 'PAID';
    } else if (paidSum > 0 && paidSum < totals.grandTotal) {
      calculatedStatus = 'PARTIALLY_PAID';
    } else if (new Date(body.dueDate || existing.dueDate) < new Date() && paidSum < totals.grandTotal) {
      if (calculatedStatus !== 'CANCELLED' && calculatedStatus !== 'DRAFT') {
        calculatedStatus = 'OVERDUE';
      }
    }

    await prisma.$transaction([
      prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      }),
      prisma.invoice.update({
        where: { id: params.id },
        data: {
          invoiceNumber: body.invoiceNumber || existing.invoiceNumber,
          customerId: body.customerId,
          invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          discountTotal: totals.discountTotal,
          grandTotal: totals.grandTotal,
          paidAmount: paidSum,
          balanceAmount,
          status: calculatedStatus,
          notes: body.notes !== undefined ? body.notes : existing.notes,
          terms: body.terms !== undefined ? body.terms : existing.terms,
          items: {
            create: calculatedItems,
          },
        },
      }),
    ]);

    const updated = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.payments.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete invoice with recorded payments (${invoice.payments.length} payment(s)). Please delete the payment transactions first.`,
        },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
