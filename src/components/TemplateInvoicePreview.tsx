'use client';

import React from 'react';
import { InvoiceTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/lib/templateConfig';
import { formatCurrency, formatDate, numberToWords } from '@/lib/utils';
import { QrCode } from 'lucide-react';

interface TemplateInvoicePreviewProps {
  config?: InvoiceTemplateConfig;
  company?: any;
  invoice?: any;
  scale?: number;
  isPrintMode?: boolean;
}

const SAMPLE_INVOICE = {
  invoiceNumber: 'INV-2026-0042',
  invoiceDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  referenceNumber: 'PO-88419',
  salesperson: 'Aslam Khan',
  project: 'Corporate Rebranding 2026',
  subject: 'Design, Offset & Vinyl Printing Collaterals',
  status: 'SENT',
  customer: {
    name: 'Rob & Joe Traders',
    companyName: 'Rob & Joe Traders Pvt Ltd',
    billingAddress: '34, Riche Street\nChennai 631603 Tamil Nadu\nIndia',
    shippingAddress: '34, Riche Street\nChennai 631603 Tamil Nadu\nIndia',
    gstin: '33AAAAA0000A1Z5',
    phone: '+91 94440 12345',
  },
  items: [
    {
      id: 'item-1',
      name: 'Brochure Design & Offset Print',
      description: 'Brochure Design Single Sided Color, 250 GSM Matte Art Card with Thermal Lamination',
      customFields: 'A4 Tri-Fold / 250 GSM',
      quantity: 500,
      unit: 'Nos',
      rate: 3.5,
      discount: 0,
      taxRate: 18,
      taxAmount: 315,
      totalAmount: 2065,
    },
    {
      id: 'item-2',
      name: 'Vinyl Flex Banner with Eyelets',
      description: 'Star Frontlit 340 GSM Banner Printing with solvent ink, Hemming and eyelets on corners',
      customFields: '10ft x 4ft (40 sq.ft)',
      quantity: 2,
      unit: 'Pcs',
      rate: 800,
      discount: 100,
      taxRate: 18,
      taxAmount: 270,
      totalAmount: 1770,
    },
    {
      id: 'item-3',
      name: 'Corporate Identity Pack (Template)',
      description: 'Custom Themes for your business, Letterheads, Visiting Cards, Envelope layout pack',
      customFields: 'Digital Master Files',
      quantity: 1,
      unit: 'Pack',
      rate: 2500,
      discount: 0,
      taxRate: 18,
      taxAmount: 450,
      totalAmount: 2950,
    },
  ],
  subtotal: 4850,
  taxTotal: 1035,
  discountTotal: 100,
  grandTotal: 5785,
  balanceAmount: 5785,
  notes: 'Looking forward for your business.\nPrime Print & Services would love your feedback. Post a review to our profile.',
  terms:
    '1) Bill must be paid within 10 days from the date of receipt.\n2) Any Queries/Corrections will be entertained only within 10 days from the date of submission of the bill.\nNo corrections will be entertained thereafter.',
};

export function TemplateInvoicePreview({
  config = DEFAULT_TEMPLATE_CONFIG,
  company,
  invoice = SAMPLE_INVOICE,
  scale = 1,
  isPrintMode = false,
}: TemplateInvoicePreviewProps) {
  // Use passed company or fallback
  const comp = company || {
    name: 'Prime Print & Services',
    companyId: 'PRIME',
    logoUrl: '/logo.png',
    address: '23/41/1068, Vaishali Nagar, Jaswantsingpura,\nCIDCO N-8, Azad Chowk to TV Center Road\nAurangabad Maharashtra 431001\nIndia',
    phone: '',
    email: '',
    website: 'https://prime-nu-nine.vercel.app/',
    gstin: '',
    pan: '',
    bankAccountName: 'Prime Sublimation & Print',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    bankBranch: 'Aurangabad Main',
    upiId: '',
  };

  const currencySymbol = comp.currencySymbol || '₹';
  const grandTotal = Number(invoice?.grandTotal) || 0;
  const balanceDue = invoice?.balanceAmount !== undefined ? Number(invoice.balanceAmount) : grandTotal;
  const totalInWords = numberToWords(grandTotal);

  // Margins in inches: 1 inch = 96px screen CSS
  const marginTop = (config.margins?.top ?? 0.7) * 96;
  const marginBottom = (config.margins?.bottom ?? 0.7) * 96;
  const marginLeft = (config.margins?.left ?? 0.55) * 96;
  const marginRight = (config.margins?.right ?? 0.4) * 96;

  // Paper Dimensions
  let paperWidth = 794; // A4 standard width in px at 96dpi (210mm)
  let minHeight = 1123; // A4 height (297mm)

  if (config.paperSize === 'A5') {
    paperWidth = 560;
    minHeight = 794;
  } else if (config.paperSize === 'Letter') {
    paperWidth = 816;
    minHeight = 1056;
  }

  if (config.orientation === 'Landscape') {
    const temp = paperWidth;
    paperWidth = minHeight;
    minHeight = temp;
  }

  const baseFontSize = config.font?.fontSize || 9; // pt
  const fontFamily = config.font?.family || 'Ubuntu';
  const labelColor = config.font?.labelColor || '#333333';
  const fontColor = config.font?.fontColor || '#333333';
  const bgColor = config.background?.color || '#ffffff';

  return (
    <div
      className={`template-invoice-root transition-all duration-200 ${
        isPrintMode ? 'print:shadow-none print:border-none' : 'shadow-2xl rounded-sm'
      }`}
      style={{
        width: `${paperWidth}px`,
        minHeight: `${minHeight}px`,
        backgroundColor: bgColor,
        paddingTop: `${marginTop}px`,
        paddingBottom: `${marginBottom}px`,
        paddingLeft: `${marginLeft}px`,
        paddingRight: `${marginRight}px`,
        fontFamily: `"${fontFamily}", system-ui, -apple-system, sans-serif`,
        color: fontColor,
        fontSize: `${baseFontSize}pt`,
        lineHeight: 1.35,
        boxSizing: 'border-box',
        position: 'relative',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {/* Dynamic Print Stylesheet strictly enforcing template properties during window.print() */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${config.paperSize || 'A4'} ${(config.orientation || 'Portrait').toLowerCase()};
                margin: ${config.margins?.top ?? 0.7}in ${config.margins?.right ?? 0.4}in ${config.margins?.bottom ?? 0.7}in ${config.margins?.left ?? 0.55}in !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: ${bgColor} !important;
                width: 100% !important;
                min-width: 100% !important;
                overflow: visible !important;
              }
              .template-invoice-root {
                width: 100% !important;
                max-width: 100% !important;
                min-height: auto !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                font-family: "${fontFamily}", system-ui, sans-serif !important;
                font-size: ${baseFontSize}pt !important;
                color: ${fontColor} !important;
                background-color: ${bgColor} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .template-invoice-root * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .template-invoice-table {
                border: ${config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || '#adadad'}` : 'none'} !important;
              }
              .template-header-th {
                background-color: ${config.table?.showHeaderBgColor !== false ? (config.table?.headerBgColor || '#3c3d3a') : 'transparent'} !important;
                color: ${config.table?.headerTextColor || '#ffffff'} !important;
                font-size: ${config.table?.headerFontSize || 9}pt !important;
                border-bottom: ${config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || '#adadad'}` : 'none'} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .template-header-th th {
                border-right: ${config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none'} !important;
                background-color: ${config.table?.showHeaderBgColor !== false ? (config.table?.headerBgColor || '#3c3d3a') : 'transparent'} !important;
                color: ${config.table?.headerTextColor || '#ffffff'} !important;
              }
              .template-row-tr {
                font-size: ${config.table?.rowFontSize || 9}pt !important;
                color: ${config.table?.rowTextColor || '#000000'} !important;
                background-color: ${config.table?.showRowBgColor ? (config.table?.rowBgColor || '#ffffff') : 'transparent'} !important;
                border-bottom: ${config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || '#adadad'}` : 'none'} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .template-row-tr td {
                border-right: ${config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || '#adadad'}` : 'none'} !important;
              }
              .template-desc-text {
                font-size: ${config.table?.descFontSize || 8}pt !important;
                color: ${config.table?.descTextColor || '#333333'} !important;
              }
            }
          `,
        }}
      />
      {/* Watermark if enabled */}
      {config.background?.showWatermark && config.background?.watermarkText && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
          style={{
            transform: 'rotate(-35deg)',
            opacity: 0.08,
            fontSize: '58pt',
            fontWeight: 900,
            color: '#000000',
            letterSpacing: '0.15em',
          }}
        >
          {config.background.watermarkText}
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: '100%' }}>
        <div>
          {/* Top Banner (if enabled) */}
          {config.header?.showHeader && config.header?.bannerText && (
            <div
              className="text-center font-bold tracking-widest text-[9pt] uppercase py-1 mb-2 border-b"
              style={{
                color: config.themeColor || '#00a3e0',
                borderColor: `${config.themeColor || '#00a3e0'}40`,
              }}
            >
              {config.header.bannerText}
            </div>
          )}

          {/* Header Row: Organization details on Left, Document Title on Right */}
          <div className="flex justify-between items-start pb-2">
            <div className="flex items-start gap-4">
              {config.organization?.showLogo && (
                <img
                  src={config.organization.logoUrl || comp.logoUrl || '/logo.png'}
                  alt="Company Logo"
                  className="h-16 w-auto object-contain shrink-0 max-w-[200px]"
                />
              )}
              <div>
                {config.organization?.showName && (
                  <h1
                    className="font-extrabold uppercase tracking-tight"
                    style={{
                      fontSize: `${config.organization.nameFontSize || 12}pt`,
                      color: config.organization.nameColor || '#0f172a',
                    }}
                  >
                    {comp.name || 'Prime Print & Services'}
                  </h1>
                )}

                <div className="mt-0.5 space-y-0.5" style={{ fontSize: `${baseFontSize * 0.9}pt` }}>
                  {comp.companyId && (
                    <div>
                      <span className="font-semibold" style={{ color: labelColor }}>
                        Company ID :
                      </span>{' '}
                      {comp.companyId}
                    </div>
                  )}
                  {config.organization?.showAddress && comp.address && (
                    <div className="whitespace-pre-line opacity-90">{comp.address}</div>
                  )}
                  {config.organization?.showPhone && comp.phone && (
                    <div>
                      <span className="font-semibold" style={{ color: labelColor }}>
                        Phone:
                      </span>{' '}
                      {comp.phone}
                    </div>
                  )}
                  {config.organization?.showEmail && comp.email && (
                    <div>
                      <span className="font-semibold" style={{ color: labelColor }}>
                        Email:
                      </span>{' '}
                      {comp.email}
                    </div>
                  )}
                  {config.organization?.showWebsite && comp.website && (
                    <div>
                      <a href={comp.website} target="_blank" rel="noreferrer" className="underline hover:opacity-80">
                        {comp.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title on Right */}
            {config.document?.showTitle && (
              <div className="text-right">
                <h2
                  className="font-black uppercase tracking-wider"
                  style={{
                    fontSize: `${config.document.titleFontSize || 26}pt`,
                    color: config.document.titleColor || '#000000',
                    lineHeight: 1.1,
                  }}
                >
                  {config.document.title || 'TAX INVOICE'}
                </h2>
              </div>
            )}
          </div>

          {/* CMYK Process Stripe (if enabled) */}
          {config.header?.showCmykStripe && (
            <div className="cmyk-stripe h-1 w-full rounded-full my-2 opacity-95" />
          )}

          {/* Document Information Metadata Box */}
          <div
            className="border mt-2"
            style={{
              borderColor: '#cbd5e1',
              fontSize: `${baseFontSize * 0.95}pt`,
            }}
          >
            <div className="grid grid-cols-2 p-2.5 divide-x divide-slate-300">
              {/* Left Column Fields */}
              <div className="space-y-1 pr-4">
                {config.document?.fields?.number?.show && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      {config.document.fields.number.label || '#'}
                    </span>
                    <span className="font-bold">: {invoice.invoiceNumber}</span>
                  </div>
                )}
                {config.document?.fields?.date?.show && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      {config.document.fields.date.label || 'Invoice Date'}
                    </span>
                    <span>: {formatDate(invoice.invoiceDate)}</span>
                  </div>
                )}
                {config.document?.fields?.dueDate?.show && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      {config.document.fields.dueDate.label || 'Due Date'}
                    </span>
                    <span>: {formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                {config.document?.fields?.reference?.show && invoice.referenceNumber && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      {config.document.fields.reference.label || 'Reference#'}
                    </span>
                    <span>: {invoice.referenceNumber}</span>
                  </div>
                )}
              </div>

              {/* Right Column Fields */}
              <div className="space-y-1 pl-4">
                {config.document?.fields?.salesperson?.show && invoice.salesperson && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      {config.document.fields.salesperson.label || 'Salesperson'}
                    </span>
                    <span>: {invoice.salesperson}</span>
                  </div>
                )}
                {config.document?.fields?.project?.show && invoice.project && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      {config.document.fields.project.label || 'Project'}
                    </span>
                    <span>: {invoice.project}</span>
                  </div>
                )}
                {config.organization?.showGstin && comp.gstin && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      GSTIN
                    </span>
                    <span>: {comp.gstin}</span>
                  </div>
                )}
                {config.organization?.showPan && comp.pan && (
                  <div className="flex">
                    <span className="w-28 font-bold" style={{ color: labelColor }}>
                      PAN
                    </span>
                    <span>: {comp.pan}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subject if enabled */}
            {config.document?.fields?.subject?.show && invoice.subject && (
              <div className="border-t border-slate-300 px-2.5 py-1.5 flex bg-slate-50/60">
                <span className="w-28 font-bold" style={{ color: labelColor }}>
                  {config.document.fields.subject.label || 'Subject'}:
                </span>
                <span className="font-medium">{invoice.subject}</span>
              </div>
            )}
          </div>

          {/* Customer Bill To & Ship To Boxes */}
          <div
            className="border-x border-b text-xs"
            style={{
              borderColor: '#cbd5e1',
              fontSize: `${baseFontSize * 0.95}pt`,
            }}
          >
            <div className="grid grid-cols-2 divide-x divide-slate-300">
              {/* Bill To */}
              <div className="p-2.5">
                <div className="font-bold uppercase tracking-wider mb-1" style={{ color: labelColor }}>
                  {config.customer?.billToLabel || 'Bill To'}
                </div>
                {config.customer?.showCompanyName && (
                  <div className="font-bold" style={{ color: fontColor }}>
                    {invoice.customer?.companyName || invoice.customer?.name}
                  </div>
                )}
                {config.customer?.showName && invoice.customer?.name && (
                  <div className="text-[10pt] opacity-80">{invoice.customer.name}</div>
                )}
                {config.customer?.showBillingAddress && invoice.customer?.billingAddress && (
                  <div className="whitespace-pre-line mt-0.5 opacity-90 leading-relaxed">
                    {invoice.customer.billingAddress}
                  </div>
                )}
                {config.customer?.showGstin && invoice.customer?.gstin && (
                  <div className="mt-1">
                    <span className="font-semibold" style={{ color: labelColor }}>
                      GSTIN:{' '}
                    </span>
                    <span className="font-bold">{invoice.customer.gstin}</span>
                  </div>
                )}
                {config.customer?.showPhone && invoice.customer?.phone && (
                  <div>
                    <span className="font-semibold" style={{ color: labelColor }}>
                      Phone:{' '}
                    </span>
                    {invoice.customer.phone}
                  </div>
                )}
              </div>

              {/* Ship To */}
              <div className="p-2.5">
                <div className="font-bold uppercase tracking-wider mb-1" style={{ color: labelColor }}>
                  {config.customer?.shipToLabel || 'Ship To'}
                </div>
                {config.customer?.showCompanyName && (
                  <div className="font-bold" style={{ color: fontColor }}>
                    {invoice.customer?.companyName || invoice.customer?.name}
                  </div>
                )}
                {config.customer?.showShippingAddress && (
                  <div className="whitespace-pre-line mt-0.5 opacity-90 leading-relaxed">
                    {invoice.customer?.shippingAddress || invoice.customer?.billingAddress}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div
            className="mt-4 template-invoice-table"
            style={{
              border: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || '#adadad'}` : 'none',
            }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="font-bold template-header-th"
                  style={{
                    backgroundColor: config.table?.showHeaderBgColor !== false ? (config.table?.headerBgColor || '#3c3d3a') : 'transparent',
                    color: config.table?.headerTextColor || '#ffffff',
                    fontSize: `${config.table?.headerFontSize || 9}pt`,
                    borderBottom: `1px solid ${config.table?.tableBorderColor || '#adadad'}`,
                  }}
                >
                  {config.table?.columns?.itemNumber?.show && (
                    <th
                      className="py-2 px-2 text-center"
                      style={{
                        width: `${config.table.columns.itemNumber.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.itemNumber.label || '#'}
                    </th>
                  )}
                  {config.table?.columns?.item?.show && (
                    <th
                      className="py-2 px-3"
                      style={{
                        width: `${config.table.columns.item.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.item.label || 'Item & Description'}
                    </th>
                  )}
                  {config.table?.columns?.customFields?.show && (
                    <th
                      className="py-2 px-3"
                      style={{
                        width: `${config.table.columns.customFields.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.customFields.label || 'Specs / Size'}
                    </th>
                  )}
                  {config.table?.columns?.quantity?.show && (
                    <th
                      className="py-2 px-3 text-right"
                      style={{
                        width: `${config.table.columns.quantity.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.quantity.label || 'Qty'}
                    </th>
                  )}
                  {config.table?.columns?.rate?.show && (
                    <th
                      className="py-2 px-3 text-right"
                      style={{
                        width: `${config.table.columns.rate.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.rate.label || 'Rate'}
                    </th>
                  )}
                  {config.table?.columns?.taxPercent?.show && (
                    <th
                      className="py-2 px-2 text-right"
                      style={{
                        width: `${config.table.columns.taxPercent.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.taxPercent.label || 'Tax %'}
                    </th>
                  )}
                  {config.table?.columns?.taxAmount?.show && (
                    <th
                      className="py-2 px-2 text-right"
                      style={{
                        width: `${config.table.columns.taxAmount.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.taxAmount.label || 'Tax'}
                    </th>
                  )}
                  {config.table?.columns?.discount?.show && (
                    <th
                      className="py-2 px-2 text-right"
                      style={{
                        width: `${config.table.columns.discount.width}%`,
                        borderRight: config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || 'rgba(255,255,255,0.25)'}` : 'none',
                      }}
                    >
                      {config.table.columns.discount.label || 'Discount'}
                    </th>
                  )}
                  {config.table?.columns?.amount?.show && (
                    <th
                      className="py-2 px-3 text-right"
                      style={{ width: `${config.table.columns.amount.width}%` }}
                    >
                      {config.table.columns.amount.label || 'Amount'}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item: any, idx: number) => {
                  const qty = Number(item.quantity) || 1;
                  const rate = Number(item.rate) || 0;
                  const amt = Number(item.totalAmount) || qty * rate;
                  const isEven = idx % 2 === 1;

                  const rowBg = config.table?.showRowBgColor
                    ? (config.table?.rowBgColor || '#ffffff')
                    : config.table?.layoutStyle === 'striped' && isEven
                    ? '#f8fafc'
                    : 'transparent';

                  const rowTextColor = config.table?.rowTextColor || '#000000';
                  const rowFontSize = config.table?.rowFontSize || 9;
                  const descFontSize = config.table?.descFontSize || 8;
                  const descTextColor = config.table?.descTextColor || '#333333';
                  const cellBorder = config.table?.showTableBorder !== false ? `1px solid ${config.table?.tableBorderColor || '#adadad'}` : 'none';

                  return (
                    <tr
                      key={item.id || idx}
                      className="align-top template-row-tr"
                      style={{
                        backgroundColor: rowBg,
                        color: rowTextColor,
                        fontSize: `${rowFontSize}pt`,
                        borderBottom: cellBorder,
                      }}
                    >
                      {config.table?.columns?.itemNumber?.show && (
                        <td className="py-2.5 px-2 text-center font-medium" style={{ borderRight: cellBorder }}>
                          {idx + 1}
                        </td>
                      )}
                      {config.table?.columns?.item?.show && (
                        <td className="py-2.5 px-3" style={{ borderRight: cellBorder }}>
                          <div className="font-bold leading-tight" style={{ color: rowTextColor }}>
                            {item.name}
                          </div>
                          {config.table?.columns?.description?.show && item.description && (
                            <div
                              className="template-desc-text mt-1 whitespace-pre-line leading-relaxed font-normal opacity-90"
                              style={{ fontSize: `${descFontSize}pt`, color: descTextColor }}
                            >
                              {item.description}
                            </div>
                          )}
                        </td>
                      )}
                      {config.table?.columns?.customFields?.show && (
                        <td className="py-2.5 px-3 text-xs" style={{ borderRight: cellBorder }}>
                          {item.customFields || '-'}
                        </td>
                      )}
                      {config.table?.columns?.quantity?.show && (
                        <td className="py-2.5 px-3 text-right font-mono" style={{ borderRight: cellBorder }}>
                          <div className="font-semibold">{qty.toFixed(2)}</div>
                          <div className="text-[8.5pt] opacity-70">{item.unit || 'pcs'}</div>
                        </td>
                      )}
                      {config.table?.columns?.rate?.show && (
                        <td className="py-2.5 px-3 text-right font-mono" style={{ borderRight: cellBorder }}>
                          {rate.toFixed(2)}
                        </td>
                      )}
                      {config.table?.columns?.taxPercent?.show && (
                        <td className="py-2.5 px-2 text-right font-mono" style={{ borderRight: cellBorder }}>
                          {item.taxRate ? `${item.taxRate}%` : '18%'}
                        </td>
                      )}
                      {config.table?.columns?.taxAmount?.show && (
                        <td className="py-2.5 px-2 text-right font-mono" style={{ borderRight: cellBorder }}>
                          {item.taxAmount ? item.taxAmount.toFixed(2) : '-'}
                        </td>
                      )}
                      {config.table?.columns?.discount?.show && (
                        <td className="py-2.5 px-2 text-right font-mono" style={{ borderRight: cellBorder }}>
                          {item.discount ? item.discount.toFixed(2) : '0.00'}
                        </td>
                      )}
                      {config.table?.columns?.amount?.show && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {amt.toFixed(2)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div
            className="border-x border-b mt-0"
            style={{
              borderColor: '#cbd5e1',
              fontSize: `${baseFontSize * 0.95}pt`,
            }}
          >
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              {/* Left Column: Total in Words, Notes, Terms, Bank & QR */}
              <div className="col-span-7 p-3 space-y-3">
                {/* Total In Words */}
                {config.total?.showTotalInWords && (
                  <div>
                    <span className="font-bold block" style={{ color: labelColor }}>
                      Total In Words:
                    </span>
                    <span className="font-semibold italic">{totalInWords}</span>
                  </div>
                )}

                {/* Notes */}
                {(config.documentSummary?.notesLabel || config.other?.showNotes) && (
                  <div className="pt-2 border-t border-slate-200">
                    <span
                      className="font-bold block mb-0.5"
                      style={{
                        color: labelColor,
                        fontSize: `${config.documentSummary?.notesFontSize || 8}pt`,
                      }}
                    >
                      {config.documentSummary?.notesLabel || config.other?.notesLabel || 'Notes'}
                    </span>
                    <div
                      className="whitespace-pre-line leading-relaxed opacity-90"
                      style={{ fontSize: `${config.documentSummary?.notesFontSize || 8}pt` }}
                    >
                      {invoice.notes || config.other?.defaultNotes}
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                {config.documentSummary?.showTerms !== false && config.other?.showTerms && (
                  <div className="pt-2 border-t border-slate-200">
                    <span
                      className="font-bold block mb-0.5"
                      style={{
                        color: labelColor,
                        fontSize: `${config.documentSummary?.termsFontSize || 8}pt`,
                      }}
                    >
                      {config.documentSummary?.termsLabel || config.other?.termsLabel || 'Terms & Conditions'}
                    </span>
                    <div
                      className="whitespace-pre-line leading-relaxed opacity-85"
                      style={{ fontSize: `${config.documentSummary?.termsFontSize || 8}pt` }}
                    >
                      {invoice.terms || config.other?.defaultTerms}
                    </div>
                  </div>
                )}

                {/* Bank Details & UPI QR Code if enabled */}
                {(config.other?.showBankDetails || config.other?.showUpiQr || config.documentSummary?.showOnlinePaymentLink) && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200">
                    {config.other?.showBankDetails && (
                      <div className="text-[8.5pt] space-y-0.5">
                        <div className="font-bold" style={{ color: labelColor }}>
                          {config.documentSummary?.onlinePaymentLinkLabel || 'Bank Account Details:'}
                        </div>
                        <div>
                          <span className="font-medium">Account:</span> {comp.bankAccountName || comp.companyName || comp.name}
                        </div>
                        <div>
                          <span className="font-medium">A/C No:</span> {comp.bankAccountNumber || '98765432101234'}
                        </div>
                        <div>
                          <span className="font-medium">IFSC:</span> {comp.bankIfsc || 'HDFC0001234'} ({comp.bankName || 'HDFC Bank'})
                        </div>
                      </div>
                    )}

                    {config.other?.showUpiQr && (
                      <div className="flex flex-col items-center pl-2 shrink-0">
                        <div className="w-16 h-16 bg-white p-1 border border-slate-300 rounded flex items-center justify-center overflow-hidden shadow-xs">
                          {config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl ? (
                            <img
                              src={config.other?.upiQrImageUrl || config.documentSummary?.upiQrImageUrl}
                              alt="UPI QR Code"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <QrCode className="w-14 h-14 text-slate-800" />
                          )}
                        </div>
                        <span className="text-[7.5pt] font-semibold text-slate-600 mt-0.5 text-center leading-tight">
                          Scan to Pay UPI
                        </span>
                        {(config.other?.upiId || comp.upiId) && (
                          <span className="text-[6.5pt] text-slate-500 font-mono mt-0.5 text-center max-w-[90px] truncate">
                            {config.other?.upiId || comp.upiId}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Financial Figures & Signature */}
              <div className="col-span-5 flex flex-col justify-between">
                <div className="divide-y divide-slate-300">
                  {config.total?.showSubtotal && (
                    <div className="flex justify-between items-center py-2 px-3">
                      <span className="font-semibold" style={{ color: labelColor }}>
                        {config.total.subtotalLabel || 'Sub Total'}
                      </span>
                      <span className="font-mono font-bold">
                        {(Number(invoice.subtotal) || grandTotal).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {config.total?.showDiscount && (Number(invoice.discountTotal) || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 text-rose-600">
                      <span className="font-semibold">
                        {config.total.discountLabel || 'Discount'}
                      </span>
                      <span className="font-mono font-bold">
                        -{' '}
                        {(Number(invoice.discountTotal) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {config.total?.showTaxBreakdown && (
                    <div className="flex justify-between items-center py-2 px-3">
                      <span className="font-semibold" style={{ color: labelColor }}>
                        {config.total.taxBreakdownLabel || 'GST Tax (18%)'}
                      </span>
                      <span className="font-mono font-bold">
                        {(Number(invoice.taxTotal) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {/* Total Box */}
                  <div
                    className="flex justify-between items-center py-2.5 px-3 font-black"
                    style={{
                      backgroundColor: `${config.themeColor || '#00a3e0'}15`,
                      color: config.themeColor || '#00a3e0',
                      fontSize: `${baseFontSize * 1.15}pt`,
                    }}
                  >
                    <span>Total</span>
                    <span className="font-mono">
                      {currencySymbol}
                      {grandTotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Balance Due */}
                  {config.total?.showBalanceDue && (
                    <div className="flex justify-between items-center py-2 px-3 font-bold">
                      <span style={{ color: labelColor }}>Balance Due</span>
                      <span
                        className="font-mono font-black"
                        style={{ color: config.total.balanceDueColor || '#00a3e0' }}
                      >
                        {currencySymbol}
                        {balanceDue.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Signature Box (Supports Document Summary Signature Image & Additional Signature) */}
                {(config.documentSummary ? config.documentSummary.showSignature !== false : config.total?.showSignature !== false) && (
                  <div className="p-3 pt-6 text-center border-t border-slate-300">
                    <div className="flex items-end justify-around gap-4">
                      {/* Primary Signature */}
                      <div className="flex-1 text-center">
                        {config.documentSummary?.signatureImageUrl && (
                          <div className="mb-1 flex justify-center">
                            <img
                              src={config.documentSummary.signatureImageUrl}
                              alt="Signature"
                              className="max-h-12 w-auto object-contain"
                            />
                          </div>
                        )}
                        <div className="border-t border-slate-400 w-36 mx-auto mb-1" />
                        <div className="text-[8pt] font-semibold" style={{ color: labelColor }}>
                          {config.documentSummary?.signatureLabel || config.total?.signatureLabel || 'Authorized Signature'}
                        </div>
                        {config.documentSummary?.signatureName && (
                          <div className="text-[7.5pt] text-slate-500 font-medium">
                            {config.documentSummary.signatureName}
                          </div>
                        )}
                      </div>

                      {/* Additional Signature if enabled */}
                      {config.documentSummary?.additionalSignature && (
                        <div className="flex-1 text-center">
                          <div className="h-10" />
                          <div className="border-t border-slate-400 w-36 mx-auto mb-1" />
                          <div className="text-[8pt] font-semibold" style={{ color: labelColor }}>
                            Customer Signature
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {config.footer?.showFooter && (
          <div className="flex justify-between items-center text-[8.5pt] text-slate-500 pt-3 border-t border-slate-200 mt-4">
            <div>{config.footer.footerText || 'Thank you for your business!'}</div>
            {config.footer.showPageNumber && <div>Page 1 of 1</div>}
          </div>
        )}
      </div>
    </div>
  );
}
