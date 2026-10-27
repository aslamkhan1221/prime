import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const url =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'libsql://prime-aslamkhan1221.aws-ap-south-1.turso.io';

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI4NTYzODIsImlkIjoiMDFhMTZlOTAtMmMwMS03ODBiLWI1ODYtMDYzOGEzMGNjNmI5Iiwia2lkIjoiN3JNZE9aU2xhSUMzTHFjbkRCUzNiMXc1cGhJVlkwRGlRT2NNdWJmN3ZHMCIsInJpZCI6Ijc0ZjUwNjAxLTU0M2UtNDZjMC04Y2Q2LTJhYWY0YWU5MmZmMSJ9.eVG3bLqC3GGbllP5yH7U9otgX9IMJ7uTefegh7t1C4t-dlAdtXukNl6rjlgT_gzzJ5kYH8U0js5Qzl8EpKaMCw';

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "CompanySetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Prime Sublimation',
    "logoUrl" TEXT,
    "address" TEXT DEFAULT '402 Creative Heights, Design District, Bangalore - 560001',
    "phone" TEXT DEFAULT '+91 98765 43210',
    "email" TEXT DEFAULT 'accounts@pixelcraftstudio.in',
    "website" TEXT DEFAULT 'https://pixelcraftstudio.in',
    "gstin" TEXT DEFAULT '',
    "pan" TEXT DEFAULT '',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "invoiceNumberStart" INTEGER NOT NULL DEFAULT 1001,
    "orderPrefix" TEXT NOT NULL DEFAULT 'ORD-',
    "orderNumberStart" INTEGER NOT NULL DEFAULT 1001,
    "defaultTaxRate" REAL NOT NULL DEFAULT 18.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "invoiceTerms" TEXT DEFAULT '1. 50% advance for graphic design / print orders.\n2. Invoices are due within 15 days of issue.\n3. Revisions beyond 3 iterations will be billed at hourly rates.',
    "paymentDetails" TEXT DEFAULT 'Payment can be made via UPI or NEFT/IMPS direct bank transfer.',
    "bankAccountName" TEXT DEFAULT 'PixelCraft Design Studio LLP',
    "bankAccountNumber" TEXT DEFAULT '98765432101234',
    "bankIfsc" TEXT DEFAULT 'HDFC0001234',
    "bankName" TEXT DEFAULT 'HDFC Bank',
    "bankBranch" TEXT DEFAULT 'MG Road, Bangalore',
    "upiId" TEXT DEFAULT 'pixelcraft@hdfcbank',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "customerType" TEXT DEFAULT 'BUSINESS',
    "salutation" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "mobile" TEXT,
    "workPhone" TEXT,
    "email" TEXT,
    "language" TEXT DEFAULT 'English',
    "gstin" TEXT,
    "pan" TEXT,
    "currency" TEXT DEFAULT 'INR',
    "openingBalance" REAL DEFAULT 0.0,
    "paymentTerms" TEXT DEFAULT 'Due on Receipt',
    "enablePortal" INTEGER DEFAULT 0,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Graphic Design',
    "itemType" TEXT NOT NULL DEFAULT 'SERVICE',
    "price" REAL NOT NULL DEFAULT 0.0,
    "costPrice" REAL NOT NULL DEFAULT 0.0,
    "taxRate" REAL NOT NULL DEFAULT 18.0,
    "unit" TEXT NOT NULL DEFAULT 'PIECE',
    "customUnit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedPartnerId" TEXT,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "subtotal" REAL NOT NULL DEFAULT 0.0,
    "taxTotal" REAL NOT NULL DEFAULT 0.0,
    "discountTotal" REAL NOT NULL DEFAULT 0.0,
    "grandTotal" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "convertedToInvoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'PIECE',
    "pricingType" TEXT NOT NULL DEFAULT 'QTY_RATE',
    "width" REAL,
    "height" REAL,
    "quantity" REAL NOT NULL DEFAULT 1.0,
    "area" REAL,
    "rate" REAL NOT NULL DEFAULT 0.0,
    "discount" REAL NOT NULL DEFAULT 0.0,
    "taxRate" REAL NOT NULL DEFAULT 18.0,
    "taxAmount" REAL NOT NULL DEFAULT 0.0,
    "totalAmount" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0.0,
    "taxTotal" REAL NOT NULL DEFAULT 0.0,
    "discountTotal" REAL NOT NULL DEFAULT 0.0,
    "grandTotal" REAL NOT NULL DEFAULT 0.0,
    "paidAmount" REAL NOT NULL DEFAULT 0.0,
    "balanceAmount" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'PIECE',
    "pricingType" TEXT NOT NULL DEFAULT 'QTY_RATE',
    "width" REAL,
    "height" REAL,
    "quantity" REAL NOT NULL DEFAULT 1.0,
    "area" REAL,
    "rate" REAL NOT NULL DEFAULT 0.0,
    "discount" REAL NOT NULL DEFAULT 0.0,
    "taxRate" REAL NOT NULL DEFAULT 18.0,
    "taxAmount" REAL NOT NULL DEFAULT 0.0,
    "totalAmount" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "bankCharges" REAL DEFAULT 0.0,
    "tdsDeducted" BOOLEAN DEFAULT 0,
    "paymentReceivedOn" DATETIME,
    "depositTo" TEXT DEFAULT 'Petty Cash',
    "status" TEXT DEFAULT 'PAID',
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "profitPercentage" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHint" TEXT,
    "permissions" TEXT DEFAULT '["dashboard","orders","invoices","reports"]'
  );`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Item_sku_key" ON "Item"("sku");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Payment_paymentNumber_key" ON "Payment"("paymentNumber");`,

  // Alter statements for newly added columns (safely ignored if already existing)
  `ALTER TABLE "Item" ADD COLUMN "salesAccount" TEXT DEFAULT 'Sales';`,
  `ALTER TABLE "Item" ADD COLUMN "purchaseAccount" TEXT DEFAULT 'Cost of Goods Sold';`,
  `ALTER TABLE "Item" ADD COLUMN "purchaseDescription" TEXT;`,
  `ALTER TABLE "Item" ADD COLUMN "preferredVendor" TEXT;`,
  `ALTER TABLE "CompanySetting" ADD COLUMN "companyId" TEXT DEFAULT 'GDS';`,
  `ALTER TABLE "CompanySetting" ADD COLUMN "reviewUrl" TEXT DEFAULT 'https://g.page/r/CfUhh8jFFKjlEAo/review';`,
];

async function syncTurso() {
  console.log('Connecting to Turso at:', url);
  const client = createClient({ url, authToken });

  console.log('Applying database schema to Turso...');
  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (e) {
      if (!e?.message?.includes('duplicate column name') && !e?.cause?.message?.includes('duplicate column name')) {
        console.warn('Notice applying statement:', e.message);
      }
    }
  }

  // Seed default admin
  const passwordHash = await bcrypt.hash('nibbanibbi77', 10);
  const existingAdmin = await client.execute({
    sql: 'SELECT id FROM "User" WHERE email = ?',
    args: ['primeadmin'],
  });

  if (existingAdmin.rows.length === 0) {
    await client.execute({
      sql: 'INSERT INTO "User" (id, email, passwordHash, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      args: ['admin_default', 'primeadmin', passwordHash, 'Prime Admin', 'ADMIN'],
    });
    console.log('Created default primeadmin user on Turso');
  } else {
    await client.execute({
      sql: 'UPDATE "User" SET passwordHash = ?, role = ? WHERE email = ?',
      args: [passwordHash, 'ADMIN', 'primeadmin'],
    });
    console.log('Updated primeadmin password to nibbanibbi77 on Turso');
  }

  // Ensure default CompanySetting
  const existingCompany = await client.execute({
    sql: 'SELECT id FROM "CompanySetting" WHERE id = ?',
    args: ['default'],
  });

  if (existingCompany.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO "CompanySetting" (
        id, companyName, companyId, logoUrl, address, phone, email, website, gstin, pan, invoiceTerms,
        reviewUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        'default',
        'Prime Print & Services',
        'PRIME',
        '/logo.png',
        '23/41/1068, Vaishali Nagar, Jaswantsingpura,\nCIDCO N-8, Azad Chowk to TV Center Road\nAurangabad Maharashtra 431001\nIndia',
        '+91 98765 43210',
        'accounts@primeprint.in',
        'https://primeprint.in',
        '27AAAAA0000A1Z5',
        'AAAAA0000A',
        '1) Bill must be paid within 10 days form the date of receipt.\n2) Any Queries/Corrections will be entertained only within 10 days form the date of Submission of the bill\nNo Corrections will be entertained thereafter.',
        'https://g.page/r/CfUhh8jFFKjlEAo/review',
      ],
    });
    console.log('Created default Prime Print & Services CompanySetting on Turso');
  } else {
    await client.execute({
      sql: `UPDATE "CompanySetting" SET 
        companyName = ?, companyId = ?, logoUrl = ?, email = ?, website = ?
        WHERE id = ?`,
      args: [
        'Prime Print & Services',
        'PRIME',
        '/logo.png',
        'accounts@primeprint.in',
        'https://primeprint.in',
        'default',
      ],
    });
    console.log('Updated CompanySetting to Prime Print & Services on Turso');
  }

  // Seed initial sample items from invoice PDF if Item table has fewer than 2 items
  const itemCount = await client.execute('SELECT COUNT(*) as count FROM "Item"');
  const count = Number(itemCount.rows[0]?.count) || 0;
  if (count === 0) {
    const sampleItems = [
      {
        id: 'item_flex_star',
        name: 'Flex Star with Frame',
        description: 'Size : 3 x 5ft\nFlex Type : Star\nPrinting Type : Solvent, Fine Quality.\nFrame Type : 0.75 in MS Frame\nWith Mounting',
        itemType: 'GOODS',
        unit: 'Sq ft',
        price: 60.0,
        costPrice: 40.0,
        salesAccount: 'Sales',
        purchaseAccount: 'Cost of Goods Sold',
      },
      {
        id: 'item_graphic_design',
        name: 'Graphic Designing Charges',
        description: 'Product Lebal Design',
        itemType: 'SERVICE',
        unit: 'pcs',
        price: 250.0,
        costPrice: 100.0,
        salesAccount: 'Design Revenue',
        purchaseAccount: 'Cost of Goods Sold',
      },
      {
        id: 'item_flex_printing',
        name: 'Flex star Printing',
        description: 'Size : 10 X 3ft\nFlex Type : Star\nPrinting Type : Solvent, Fine Quality.',
        itemType: 'GOODS',
        unit: 'Sq ft',
        price: 30.0,
        costPrice: 18.0,
        salesAccount: 'Printing Revenue',
        purchaseAccount: 'Cost of Goods Sold',
      },
      {
        id: 'item_vinyl_foam',
        name: 'Vinyl With 5mm Foam Sheet',
        description: 'Size : 2 x 3ft\nMedia Type : Self Adhisive Vinyl\nPrinting Type : Eco-Solvent\nLamination Type : Matt / Gloss\nFoam Thikness : 5 mm',
        itemType: 'GOODS',
        unit: 'Sq ft',
        price: 140.0,
        costPrice: 95.0,
        salesAccount: 'Sales',
        purchaseAccount: 'Raw Materials',
      },
      {
        id: 'item_social_media',
        name: 'Social Media Post Design',
        description: 'Invitation Post Design',
        itemType: 'SERVICE',
        unit: 'pcs',
        price: 300.0,
        costPrice: 120.0,
        salesAccount: 'Design Revenue',
        purchaseAccount: 'Cost of Goods Sold',
      },
    ];

    for (const it of sampleItems) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO "Item" (
          id, name, description, itemType, unit, price, costPrice, salesAccount, purchaseAccount, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          it.id,
          it.name,
          it.description,
          it.itemType,
          it.unit,
          it.price,
          it.costPrice,
          it.salesAccount,
          it.purchaseAccount,
        ],
      });
    }
    console.log('Seeded sample items from invoice PDF into Turso database');
  }

  console.log('Turso synchronization complete!');
}

syncTurso().catch((err) => {
  console.error('Turso sync error:', err);
  process.exit(0); // Do not fail build if network is unavailable during build
});
