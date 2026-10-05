import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            grandTotal: true,
            status: true,
            orderDate: true,
            customer: { select: { name: true } },
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    let parsedPermissions = ['dashboard', 'orders', 'invoices', 'reports'];
    if (partner.permissions) {
      try {
        parsedPermissions = JSON.parse(partner.permissions);
      } catch {
        // fallback
      }
    }

    // Check user account
    let userAccount = null;
    if (partner.email) {
      userAccount = await prisma.user.findUnique({
        where: { email: partner.email },
        select: { id: true, email: true, role: true, createdAt: true },
      });
    }

    return NextResponse.json({
      partner: {
        ...partner,
        hasLoginAccount: !!userAccount,
        parsedPermissions,
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

    const currentPartner = await prisma.partner.findUnique({ where: { id: params.id } });
    if (!currentPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Handle Revoke / Delete Login Action specifically
    if (body.revokeLogin === true) {
      if (currentPartner.email) {
        await prisma.user.deleteMany({
          where: { email: currentPartner.email, role: 'PARTNER' },
        });
      }
      const updated = await prisma.partner.update({
        where: { id: params.id },
        data: {
          passwordHint: null,
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Partner login access revoked successfully',
        partner: updated,
      });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
    }

    const percentage = Number(body.profitPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return NextResponse.json({ error: 'Profit percentage must be between 0.01% and 100%' }, { status: 400 });
    }

    const oldEmail = currentPartner.email;
    const email = body.email ? body.email.trim().toLowerCase() : currentPartner.email;
    const plainPassword = body.password?.trim();

    const permissionsJson = Array.isArray(body.permissions)
      ? JSON.stringify(body.permissions)
      : body.permissions !== undefined
      ? body.permissions
      : currentPartner.permissions;

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        name: body.name.trim(),
        email: email || null,
        phone: body.phone?.trim() || null,
        profitPercentage: percentage,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        notes: body.notes?.trim() || null,
        permissions: permissionsJson,
        passwordHint: plainPassword ? plainPassword : currentPartner.passwordHint,
      },
    });

    // Update or Create User Account if email is present
    if (email) {
      // If email changed, remove or update old user
      if (oldEmail && oldEmail !== email) {
        await prisma.user.deleteMany({ where: { email: oldEmail, role: 'PARTNER' } });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (plainPassword) {
        const passwordHash = await hashPassword(plainPassword);
        if (existingUser) {
          await prisma.user.update({
            where: { email },
            data: {
              name: body.name.trim(),
              passwordHash,
              role: 'PARTNER',
            },
          });
        } else {
          await prisma.user.create({
            data: {
              name: body.name.trim(),
              email,
              passwordHash,
              role: 'PARTNER',
            },
          });
        }
      } else if (existingUser) {
        await prisma.user.update({
          where: { email },
          data: {
            name: body.name.trim(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      partner,
      credentials: plainPassword && email ? {
        name: partner.name,
        email,
        password: plainPassword,
        role: 'PARTNER',
      } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const partner = await prisma.partner.findUnique({ where: { id: params.id } });
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Delete partner user account if role is PARTNER
    if (partner.email) {
      await prisma.user.deleteMany({
        where: { email: partner.email, role: 'PARTNER' },
      });
    }

    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Partner and login access deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
