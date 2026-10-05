import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate Invoice Number
    const settings = await prisma.companySetting.findUnique({ where: { id: 'default' } });
    const prefix = settings?.invoicePrefix || 'INV-';
    const invCount = await prisma.invoice.count();
    const startNum = settings?.invoiceNumberStart || 1001;
    const invoiceNumber = `${prefix}${startNum + invCount}`;

    // Due date default to 15 days from today
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoiceItems = order.items.map((item) => ({
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

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: order.customerId,
        orderId: order.id,
        invoiceDate,
        dueDate,
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        discountTotal: order.discountTotal,
        grandTotal: order.grandTotal,
        paidAmount: 0.0,
        balanceAmount: order.grandTotal,
        status: 'DRAFT',
        notes: `Converted from Order #${order.orderNumber}. ${order.notes || ''}`.trim(),
        terms: settings?.invoiceTerms || null,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Update order status to Completed or Confirmed and link converted invoice
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        convertedToInvoiceId: invoice.id,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
