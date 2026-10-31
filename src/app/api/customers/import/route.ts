import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const customers = body.customers;
    const conflictMode = body.conflictMode || 'skip'; // 'skip' | 'update' | 'create_always'

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: 'No customers provided for import' }, { status: 400 });
    }

    // Fetch existing customers for duplicate matching
    const existingCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
    });

    const mobileMap = new Map<string, string>(); // cleaned 10 digits -> id
    const emailMap = new Map<string, string>(); // email.toLowerCase() -> id
    const nameMap = new Map<string, string>(); // name.toLowerCase() -> id

    const cleanPhone = (p: string | null | undefined) => {
      if (!p) return '';
      const digits = String(p).replace(/\D/g, '');
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    existingCustomers.forEach((c) => {
      if (c.name) nameMap.set(c.name.trim().toLowerCase(), c.id);
      if (c.email) emailMap.set(c.email.trim().toLowerCase(), c.id);
      const cp = cleanPhone(c.mobile);
      if (cp) mobileMap.set(cp, c.id);
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < customers.length; i++) {
      const raw = customers[i];
      const rowNum = i + 1;

      const name = String(raw.name ?? '').trim();
      if (!name) {
        errors.push(`Row ${rowNum}: Customer Name is required and was empty. Skipped.`);
        skippedCount++;
        continue;
      }

      const email = raw.email ? String(raw.email).trim().toLowerCase() : null;
      const mobile = raw.mobile ? String(raw.mobile).trim() : null;
      const cMobile = cleanPhone(mobile);

      const customerType =
        raw.customerType && String(raw.customerType).trim().toUpperCase() === 'INDIVIDUAL'
          ? 'INDIVIDUAL'
          : 'BUSINESS';

      const openingBalance =
        raw.openingBalance !== undefined && raw.openingBalance !== ''
          ? Number(raw.openingBalance) || 0
          : 0;

      const rawStatus = raw.status ? String(raw.status).trim().toUpperCase() : 'ACTIVE';
      const validStatuses = ['ACTIVE', 'CLIENT', 'LEAD', 'INACTIVE'];
      const status = validStatuses.includes(rawStatus) ? rawStatus : 'ACTIVE';

      const customerData: any = {
        name,
        customerType,
        openingBalance,
        status,
      };

      if (raw.salutation !== undefined && raw.salutation !== '') customerData.salutation = String(raw.salutation).trim();
      if (raw.firstName !== undefined && raw.firstName !== '') customerData.firstName = String(raw.firstName).trim();
      if (raw.lastName !== undefined && raw.lastName !== '') customerData.lastName = String(raw.lastName).trim();
      if (raw.companyName !== undefined && raw.companyName !== '') customerData.companyName = String(raw.companyName).trim();
      if (mobile) customerData.mobile = mobile;
      if (raw.workPhone !== undefined && raw.workPhone !== '') customerData.workPhone = String(raw.workPhone).trim();
      if (email) customerData.email = email;
      if (raw.gstin !== undefined && raw.gstin !== '') customerData.gstin = String(raw.gstin).trim().toUpperCase();
      if (raw.pan !== undefined && raw.pan !== '') customerData.pan = String(raw.pan).trim().toUpperCase();
      if (raw.currency !== undefined && raw.currency !== '') customerData.currency = String(raw.currency).trim();
      if (raw.paymentTerms !== undefined && raw.paymentTerms !== '') customerData.paymentTerms = String(raw.paymentTerms).trim();
      if (raw.billingAddress !== undefined && raw.billingAddress !== '') customerData.billingAddress = String(raw.billingAddress).trim();
      if (raw.shippingAddress !== undefined && raw.shippingAddress !== '') customerData.shippingAddress = String(raw.shippingAddress).trim();
      if (raw.notes !== undefined && raw.notes !== '') customerData.notes = String(raw.notes).trim();

      // Check duplicate
      let existingId: string | undefined;
      if (cMobile && mobileMap.has(cMobile)) {
        existingId = mobileMap.get(cMobile);
      } else if (email && emailMap.has(email)) {
        existingId = emailMap.get(email);
      } else if (nameMap.has(name.toLowerCase())) {
        existingId = nameMap.get(name.toLowerCase());
      }

      if (existingId) {
        if (conflictMode === 'skip') {
          skippedCount++;
          continue;
        } else if (conflictMode === 'update') {
          try {
            await prisma.customer.update({
              where: { id: existingId },
              data: customerData,
            });
            updatedCount++;
            continue;
          } catch (err: any) {
            errors.push(`Row ${rowNum} (${name}): Update failed - ${err.message}`);
            skippedCount++;
            continue;
          }
        }
        // If conflictMode === 'create_always', fall through to creation
      }

      try {
        const created = await prisma.customer.create({
          data: {
            ...customerData,
            language: customerData.language || 'English',
            paymentTerms: customerData.paymentTerms || 'Due on Receipt',
            currency: customerData.currency || 'INR',
          },
        });
        createdCount++;
        nameMap.set(name.toLowerCase(), created.id);
        if (created.email) emailMap.set(created.email.toLowerCase(), created.id);
        if (cMobile) mobileMap.set(cMobile, created.id);
      } catch (err: any) {
        errors.push(`Row ${rowNum} (${name}): Creation failed - ${err.message}`);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: customers.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
