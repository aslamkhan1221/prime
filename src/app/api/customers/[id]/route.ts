import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          include: {
            payments: true,
          },
        },
        orders: {
          orderBy: { orderDate: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const totalBilled = customer.invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = customer.invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const pendingAmount = customer.invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

    return NextResponse.json({
      customer: {
        ...customer,
        totalOrders: customer.orders.length,
        totalInvoices: customer.invoices.length,
        totalBilled,
        totalPaid,
        pendingAmount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: body.name.trim(),
        companyName: body.companyName?.trim() || null,
        mobile: body.mobile?.trim() || null,
        email: body.email?.trim() || null,
        gstin: body.gstin?.trim()?.toUpperCase() || null,
        pan: body.pan?.trim()?.toUpperCase() || null,
        billingAddress: body.billingAddress?.trim() || null,
        shippingAddress: body.shippingAddress?.trim() || null,
        notes: body.notes?.trim() || null,
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoiceCount = await prisma.invoice.count({ where: { customerId: params.id } });
    const orderCount = await prisma.order.count({ where: { customerId: params.id } });

    if (invoiceCount > 0 || orderCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete customer with ${invoiceCount} invoice(s) and ${orderCount} order(s). You can mark the customer as Inactive instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
