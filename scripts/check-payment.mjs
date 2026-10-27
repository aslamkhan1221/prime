import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://prime-aslamkhan1221.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI4NTYzODIsImlkIjoiMDFhMTZlOTAtMmMwMS03ODBiLWI1ODYtMDYzOGEzMGNjNmI5Iiwia2lkIjoiN3JNZE9aU2xhSUMzTHFjbkRCUzNiMXc1cGhJVlkwRGlRT2NNdWJmN3ZHMCIsInJpZCI6Ijc0ZjUwNjAxLTU0M2UtNDZjMC04Y2Q2LTJhYWY0YWU5MmZmMSJ9.eVG3bLqC3GGbllP5yH7U9otgX9IMJ7uTefegh7t1C4t-dlAdtXukNl6rjlgT_gzzJ5kYH8U0js5Qzl8EpKaMCw';

async function check() {
  const client = createClient({ url, authToken });
  const info = await client.execute('PRAGMA table_info("Payment")');
  console.log('Payment columns:', info.rows.map(r => r.name));
}

check().catch(console.error);
