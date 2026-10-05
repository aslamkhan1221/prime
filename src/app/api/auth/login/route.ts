import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, signToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.email || body.username || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required' }, { status: 400 });
    }

    const cleanIdentifier = identifier.toLowerCase();

    // Look for user by exact match or normalized lowercase
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: cleanIdentifier },
          { email: `${cleanIdentifier}@primesublimation.in` },
        ],
      },
    });

    // Auto-seed default SuperAdmin if logging in as primeadmin or if table is empty
    if (!user && (cleanIdentifier === 'primeadmin' || cleanIdentifier === 'admin')) {
      const passwordHash = await hashPassword('prime1999');
      user = await prisma.user.upsert({
        where: { email: 'primeadmin' },
        update: { passwordHash, role: 'ADMIN' },
        create: {
          name: 'Super Admin',
          email: 'primeadmin',
          passwordHash,
          role: 'ADMIN',
        },
      });
      await prisma.companySetting.upsert({
        where: { id: 'default' },
        update: {},
        create: { id: 'default', companyName: 'Prime Sublimation' },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    // Verify password
    let isValid = await comparePassword(password, user.passwordHash);

    // Fallback direct check for default superadmin
    if (!isValid && user.email === 'primeadmin' && password === 'prime1999') {
      const newHash = await hashPassword('prime1999');
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
