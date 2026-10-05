import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ needsSetup: userCount === 0 });
  } catch (err: any) {
    console.error('Setup check fallback:', err?.message || err);
    // Return 200 with needsSetup: false so login form renders smoothly without crashing
    return NextResponse.json({ needsSetup: false, message: 'Ready for login' }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ error: 'Setup has already been completed. Please log in.' }, { status: 400 });
    }

    const { name, email, password, companyName } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'ADMIN',
      },
    });

    // Initialize company settings if provided
    await prisma.companySetting.upsert({
      where: { id: 'default' },
      update: companyName ? { companyName } : {},
      create: {
        id: 'default',
        companyName: companyName || 'Prime Sublimation',
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: err.message || 'Failed to complete setup' }, { status: 500 });
  }
}
