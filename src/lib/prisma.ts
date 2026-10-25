import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  libsql: any;
};

const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'libsql://prime-aslamkhan1221.aws-ap-south-1.turso.io';

const TURSO_AUTH_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI4NTYzODIsImlkIjoiMDFhMTZlOTAtMmMwMS03ODBiLWI1ODYtMDYzOGEzMGNjNmI5Iiwia2lkIjoiN3JNZE9aU2xhSUMzTHFjbkRCUzNiMXc1cGhJVlkwRGlRT2NNdWJmN3ZHMCIsInJpZCI6Ijc0ZjUwNjAxLTU0M2UtNDZjMC04Y2Q2LTJhYWY0YWU5MmZmMSJ9.eVG3bLqC3GGbllP5yH7U9otgX9IMJ7uTefegh7t1C4t-dlAdtXukNl6rjlgT_gzzJ5kYH8U0js5Qzl8EpKaMCw';

function createPrismaClient(): PrismaClient {
  try {
    if (TURSO_URL && (TURSO_URL.startsWith('libsql://') || TURSO_URL.startsWith('https://'))) {
      const libsql =
        globalForPrisma.libsql ??
        (globalForPrisma.libsql = createClient({
          url: TURSO_URL,
          authToken: TURSO_AUTH_TOKEN,
        }));

      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({
        adapter,
        log: ['error'],
      });
    }
  } catch (err) {
    console.error('Failed to initialize Prisma LibSQL adapter:', err);
  }

  return new PrismaClient({
    log: ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());

export function getLibSql() {
  return (
    globalForPrisma.libsql ??
    (globalForPrisma.libsql = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN,
    }))
  );
}

