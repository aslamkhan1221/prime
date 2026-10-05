import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const original = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'Original invoice not found' }, { status: 404 });
    }

    const settings = await prisma.companySetting.findUnique({ where: { id: 'default' } });
    const prefix = settings?.invoicePrefix || 'INV-';
    const invCount = await prisma.invoice.count();
    const startNum = settings?.invoiceNumberStart || 1001;
    const invoiceNumber = `${prefix}${startNum + invCount}`;

    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const duplicateItems = original.items.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      unit: item.unit,
      pricingType: item.pricingType,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      area: item.area,
      rate: item.rate,
      discount: item.discount,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      totalAmount: item.totalAmount,
    }));

    const duplicate = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: original.customerId,
        invoiceDate,
        dueDate,
        subtotal: original.subtotal,
        taxTotal: original.taxTotal,
        discountTotal: original.discountTotal,
        grandTotal: original.grandTotal,
        paidAmount: 0.0,
        balanceAmount: original.grandTotal,
        status: 'DRAFT',
        notes: original.notes,
        terms: original.terms,
        items: {
          create: duplicateItems,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice: duplicate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
