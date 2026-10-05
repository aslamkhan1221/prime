import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.companySetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          id: 'default',
          companyName: 'PixelCraft Design Studio',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const updated = await prisma.companySetting.upsert({
      where: { id: 'default' },
      update: {
        companyName: body.companyName,
        logoUrl: body.logoUrl,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        gstin: body.gstin,
        pan: body.pan,
        invoicePrefix: body.invoicePrefix || 'INV-',
        invoiceNumberStart: Number(body.invoiceNumberStart) || 1001,
        orderPrefix: body.orderPrefix || 'ORD-',
        orderNumberStart: Number(body.orderNumberStart) || 1001,
        defaultTaxRate: Number(body.defaultTaxRate) ?? 18.0,
        currency: body.currency || 'INR',
        currencySymbol: body.currencySymbol || '₹',
        invoiceTerms: body.invoiceTerms,
        paymentDetails: body.paymentDetails,
        bankAccountName: body.bankAccountName,
        bankAccountNumber: body.bankAccountNumber,
        bankIfsc: body.bankIfsc,
        bankName: body.bankName,
        bankBranch: body.bankBranch,
        upiId: body.upiId,
      },
      create: {
        id: 'default',
        companyName: body.companyName || 'PixelCraft Design Studio',
        ...body,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
