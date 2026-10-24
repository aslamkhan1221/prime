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
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanIdentifier = identifier.toLowerCase();

    // 1. Direct Master Admin Authentication (Requested: primeadmin / nibbanibbi77)
    if (
      (cleanIdentifier === 'primeadmin' || cleanIdentifier === 'admin') &&
      password === 'nibbanibbi77'
    ) {
      let adminUser: { id: string; name: string; email: string; role: string } = {
        id: 'admin_default',
        name: 'Prime Admin',
        email: 'primeadmin',
        role: 'ADMIN',
      };

      try {
        const passwordHash = await hashPassword('nibbanibbi77');
        const dbUser = await prisma.user.upsert({
          where: { email: 'primeadmin' },
          update: {
            passwordHash,
            role: 'ADMIN',
            name: 'Prime Admin',
          },
          create: {
            name: 'Prime Admin',
            email: 'primeadmin',
            passwordHash,
            role: 'ADMIN',
          },
        });

        if (dbUser) {
          adminUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
          };
        }

        await prisma.companySetting.upsert({
          where: { id: 'default' },
          update: {},
          create: { id: 'default', companyName: 'Prime Sublimation' },
        });
      } catch (dbErr) {
        console.warn('Prisma DB sync fallback during admin login (using memory session):', dbErr);
      }

      const token = signToken({
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });

      const response = NextResponse.json({
        success: true,
        user: adminUser,
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
    }

    // 2. Database lookup for other users or partners
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { email: cleanIdentifier },
            { email: `${cleanIdentifier}@primesublimation.in` },
          ],
        },
      });
    } catch (dbErr) {
      console.error('Database query error during login:', dbErr);
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password for DB users
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
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
