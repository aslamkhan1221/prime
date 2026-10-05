import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/calculations';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignedPartner: { select: { id: true, name: true, email: true } },
        items: true,
        invoices: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If partner, ensure order is assigned to them
    if (user.role === 'PARTNER' && user.partnerId && order.assignedPartnerId !== user.partnerId) {
      return NextResponse.json({ error: 'Access denied to this order' }, { status: 403 });
    }

    return NextResponse.json({ order });
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
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
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

    // Delete existing items and replace with updated ones in a transaction
    await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { orderId: params.id },
      }),
      prisma.order.update({
        where: { id: params.id },
        data: {
          orderNumber: body.orderNumber,
          customerId: body.customerId,
          assignedPartnerId: body.assignedPartnerId !== undefined ? body.assignedPartnerId || null : undefined,
          orderDate: body.orderDate ? new Date(body.orderDate) : undefined,
          expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          discountTotal: totals.discountTotal,
          grandTotal: totals.grandTotal,
          status: body.status || 'PENDING',
          notes: body.notes || null,
          items: {
            create: calculatedItems,
          },
        },
      }),
    ]);

    const updatedOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignedPartner: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { invoices: true },
    });

    if (order && order.invoices.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete order that has been converted to an invoice.' },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
