export interface InvoiceTemplateConfig {
  id?: string;
  name: string;
  themeName?: string;
  themeColor: string;

  // General -> Template Properties
  paperSize: 'A4' | 'A5' | 'Letter';
  orientation: 'Portrait' | 'Landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  // General -> Font
  font: {
    family: string;
    labelColor: string;
    fontColor: string;
    fontSize: number; // in pt
  };

  // General -> Background
  background: {
    color: string;
    watermarkText: string;
    showWatermark: boolean;
  };

  // Header & Footer
  header: {
    showHeader: boolean;
    bannerText: string;
    showCmykStripe: boolean;
  };
  footer: {
    showFooter: boolean;
    footerText: string;
    showPageNumber: boolean;
  };

  // Transaction Details -> Organization Details
  organization: {
    showLogo: boolean;
    logoUrl?: string;
    showName: boolean;
    nameColor: string;
    nameFontSize: number;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showGstin: boolean;
    showPan: boolean;
  };

  // Transaction Details -> Customer Details
  customer: {
    showName: boolean;
    showCompanyName: boolean;
    showBillingAddress: boolean;
    showShippingAddress: boolean;
    showGstin: boolean;
    showPhone: boolean;
    billToLabel: string;
    shipToLabel: string;
  };

  // Transaction Details -> Document Details
  document: {
    showTitle: boolean;
    title: string;
    titleFontSize: number;
    titleColor: string;
    showPhone: boolean;
    phoneLabel: string;
    showFax: boolean;
    faxLabel: string;

    fields: {
      number: { show: boolean; label: string };
      date: { show: boolean; label: string };
      dueDate: { show: boolean; label: string };
      reference: { show: boolean; label: string };
      salesperson: { show: boolean; label: string };
      project: { show: boolean; label: string };
      subject: { show: boolean; label: string };
    };
  };

  // Table -> Table Properties
  table: {
    layoutStyle: 'grid' | 'clean' | 'striped';
    headerBgColor: string;
    headerTextColor: string;
    addTaxToAmount: boolean;
    columns: {
      itemNumber: { show: boolean; width: number; label: string };
      item: { show: boolean; width: number; label: string };
      description: { show: boolean; label: string };
      customFields: { show: boolean; width: number; label: string };
      quantity: { show: boolean; width: number; label: string };
      rate: { show: boolean; width: number; label: string };
      taxPercent: { show: boolean; width: number; label: string };
      taxAmount: { show: boolean; width: number; label: string };
      discount: { show: boolean; width: number; label: string };
      amount: { show: boolean; width: number; label: string };
    };
  };

  // Total
  total: {
    showSubtotal: boolean;
    subtotalLabel: string;
    showDiscount: boolean;
    discountLabel: string;
    showTaxBreakdown: boolean;
    taxBreakdownLabel: string;
    showRoundOff: boolean;
    showTotalInWords: boolean;
    showBalanceDue: boolean;
    balanceDueColor: string;
    showSignature: boolean;
    signatureLabel: string;
  };

  // Other Details
  other: {
    showNotes: boolean;
    notesLabel: string;
    defaultNotes: string;
    showTerms: boolean;
    termsLabel: string;
    defaultTerms: string;
    showBankDetails: boolean;
    showUpiQr: boolean;
    showGoogleReview: boolean;
  };
}

export const DEFAULT_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  name: 'Standard Template',
  themeName: 'Prime Cyan & CMYK',
  themeColor: '#00a3e0',

  paperSize: 'A4',
  orientation: 'Portrait',
  margins: {
    top: 0.7,
    bottom: 0.7,
    left: 0.55,
    right: 0.4,
  },

  font: {
    family: 'Ubuntu',
    labelColor: '#333333',
    fontColor: '#333333',
    fontSize: 9,
  },

  background: {
    color: '#ffffff',
    watermarkText: '',
    showWatermark: false,
  },

  header: {
    showHeader: true,
    bannerText: 'PRINT EVERYTHING YOU WANT',
    showCmykStripe: true,
  },
  footer: {
    showFooter: true,
    footerText: 'Thank you for your business!',
    showPageNumber: true,
  },

  organization: {
    showLogo: true,
    logoUrl: '/logo.png',
    showName: true,
    nameColor: '#0f172a',
    nameFontSize: 13,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: true,
    showGstin: true,
    showPan: true,
  },

  customer: {
    showName: true,
    showCompanyName: true,
    showBillingAddress: true,
    showShippingAddress: true,
    showGstin: true,
    showPhone: true,
    billToLabel: 'Bill To',
    shipToLabel: 'Ship To',
  },

  document: {
    showTitle: true,
    title: 'TAX INVOICE',
    titleFontSize: 28,
    titleColor: '#000000',
    showPhone: true,
    phoneLabel: 'Phone',
    showFax: false,
    faxLabel: 'Fax',
    fields: {
      number: { show: true, label: '#' },
      date: { show: true, label: 'Invoice Date' },
      dueDate: { show: true, label: 'Due Date' },
      reference: { show: true, label: 'Reference#' },
      salesperson: { show: false, label: 'Salesperson' },
      project: { show: false, label: 'Project Name' },
      subject: { show: true, label: 'Subject' },
    },
  },

  table: {
    layoutStyle: 'grid',
    headerBgColor: '#00a3e0',
    headerTextColor: '#ffffff',
    addTaxToAmount: false,
    columns: {
      itemNumber: { show: true, width: 5, label: '#' },
      item: { show: true, width: 30, label: 'Item & Description' },
      description: { show: true, label: 'Description' },
      customFields: { show: true, width: 11, label: 'Specs / Size' },
      quantity: { show: true, width: 11, label: 'Qty' },
      rate: { show: true, width: 11, label: 'Rate' },
      taxPercent: { show: true, width: 11, label: 'Tax %' },
      taxAmount: { show: true, width: 11, label: 'Tax' },
      discount: { show: true, width: 11, label: 'Discount' },
      amount: { show: true, width: 15, label: 'Amount' },
    },
  },

  total: {
    showSubtotal: true,
    subtotalLabel: 'Sub Total',
    showDiscount: true,
    discountLabel: 'Discount Total',
    showTaxBreakdown: true,
    taxBreakdownLabel: 'GST Tax',
    showRoundOff: true,
    showTotalInWords: true,
    showBalanceDue: true,
    balanceDueColor: '#00a3e0',
    showSignature: true,
    signatureLabel: 'Authorized Signature for Prime Print & Services',
  },

  other: {
    showNotes: true,
    notesLabel: 'Notes',
    defaultNotes: 'Thanks for your business.\nPrime Print & Services would love your feedback. Post a review to our profile.',
    showTerms: true,
    termsLabel: 'Terms & Conditions',
    defaultTerms: '1) Bill must be paid within 10 days form the date of receipt.\n2) Any Queries/Corrections will be entertained only within 10 days form the date of Submission of the bill.\nNo Corrections will be entertained thereafter.',
    showBankDetails: true,
    showUpiQr: true,
    showGoogleReview: true,
  },
};

export const COLOR_THEMES = [
  {
    name: 'Prime Cyan & CMYK',
    themeColor: '#00a3e0',
    headerBgColor: '#00a3e0',
    headerTextColor: '#ffffff',
    titleColor: '#00a3e0',
    balanceDueColor: '#00a3e0',
  },
  {
    name: 'Classic Deep Slate',
    themeColor: '#1e293b',
    headerBgColor: '#1e293b',
    headerTextColor: '#ffffff',
    titleColor: '#0f172a',
    balanceDueColor: '#0f172a',
  },
  {
    name: 'Zoho Books Blue',
    themeColor: '#0284c7',
    headerBgColor: '#0284c7',
    headerTextColor: '#ffffff',
    titleColor: '#0369a1',
    balanceDueColor: '#0284c7',
  },
  {
    name: 'Process Magenta Splash',
    themeColor: '#ec008c',
    headerBgColor: '#ec008c',
    headerTextColor: '#ffffff',
    titleColor: '#ec008c',
    balanceDueColor: '#ec008c',
  },
  {
    name: 'Emerald Green',
    themeColor: '#059669',
    headerBgColor: '#059669',
    headerTextColor: '#ffffff',
    titleColor: '#065f46',
    balanceDueColor: '#059669',
  },
  {
    name: 'Modern Charcoal Dark',
    themeColor: '#333333',
    headerBgColor: '#333333',
    headerTextColor: '#ffffff',
    titleColor: '#111111',
    balanceDueColor: '#111111',
  },
];

export const FONT_OPTIONS = [
  { value: 'Ubuntu', label: 'Ubuntu (Recommended)' },
  { value: 'Inter', label: 'Inter (Modern Sans)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman (Serif)' },
  { value: 'Courier', label: 'Courier (Monospace)' },
];
