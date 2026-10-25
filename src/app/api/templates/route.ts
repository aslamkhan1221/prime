import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { DEFAULT_TEMPLATE_CONFIG, InvoiceTemplateConfig } from '@/lib/templateConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.companySetting.findUnique({
      where: { id: 'default' },
    });

    let config: InvoiceTemplateConfig = DEFAULT_TEMPLATE_CONFIG;

    if (settings && (settings as any).templateConfig) {
      try {
        const parsed = JSON.parse((settings as any).templateConfig);
        // Deep merge with defaults so newly added keys are always safely present
        config = {
          ...DEFAULT_TEMPLATE_CONFIG,
          ...parsed,
          margins: { ...DEFAULT_TEMPLATE_CONFIG.margins, ...(parsed.margins || {}) },
          font: { ...DEFAULT_TEMPLATE_CONFIG.font, ...(parsed.font || {}) },
          background: { ...DEFAULT_TEMPLATE_CONFIG.background, ...(parsed.background || {}) },
          header: { ...DEFAULT_TEMPLATE_CONFIG.header, ...(parsed.header || {}) },
          footer: { ...DEFAULT_TEMPLATE_CONFIG.footer, ...(parsed.footer || {}) },
          organization: { ...DEFAULT_TEMPLATE_CONFIG.organization, ...(parsed.organization || {}) },
          customer: { ...DEFAULT_TEMPLATE_CONFIG.customer, ...(parsed.customer || {}) },
          document: {
            ...DEFAULT_TEMPLATE_CONFIG.document,
            ...(parsed.document || {}),
            fields: { ...DEFAULT_TEMPLATE_CONFIG.document.fields, ...(parsed.document?.fields || {}) },
          },
          table: {
            ...DEFAULT_TEMPLATE_CONFIG.table,
            ...(parsed.table || {}),
            columns: { ...DEFAULT_TEMPLATE_CONFIG.table.columns, ...(parsed.table?.columns || {}) },
          },
          total: { ...DEFAULT_TEMPLATE_CONFIG.total, ...(parsed.total || {}) },
          documentSummary: { ...DEFAULT_TEMPLATE_CONFIG.documentSummary, ...(parsed.documentSummary || {}) },
          other: { ...DEFAULT_TEMPLATE_CONFIG.other, ...(parsed.other || {}) },
        };
      } catch (err) {
        console.error('Failed to parse stored templateConfig JSON, falling back to default:', err);
      }
    }

    return NextResponse.json({
      success: true,
      config,
      company: settings
        ? {
            name: settings.companyName,
            logoUrl: settings.logoUrl,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            website: settings.website,
            gstin: settings.gstin,
            pan: settings.pan,
            currencySymbol: settings.currencySymbol,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Error fetching template config:', err);
    return NextResponse.json({ success: false, error: err.message, config: DEFAULT_TEMPLATE_CONFIG }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const configToSave: InvoiceTemplateConfig = body.config || body;

    const jsonString = JSON.stringify(configToSave);

    await prisma.companySetting.upsert({
      where: { id: 'default' },
      update: {
        templateConfig: jsonString,
      } as any,
      create: {
        id: 'default',
        companyName: 'Prime Print & Services',
        logoUrl: '/logo.png',
        templateConfig: jsonString,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Template configuration saved successfully',
      config: configToSave,
    });
  } catch (err: any) {
    console.error('Error saving template config:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
