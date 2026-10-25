import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = "₹"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0.00`;
  }
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const UNIT_OPTIONS = [
  { value: "PIECE", label: "Piece (pc)" },
  { value: "SQ_FT", label: "Square Foot (sq ft)" },
  { value: "SQ_INCH", label: "Square Inch (sq in)" },
  { value: "SQ_METER", label: "Square Meter (sq m)" },
  { value: "SQ_CM", label: "Square CM (sq cm)" },
  { value: "FOOT", label: "Foot (ft)" },
  { value: "INCH", label: "Inch (in)" },
  { value: "METER", label: "Meter (m)" },
  { value: "CM", label: "Centimeter (cm)" },
  { value: "MM", label: "Millimeter (mm)" },
  { value: "HOUR", label: "Hour (hr)" },
  { value: "DAY", label: "Day" },
  { value: "CUSTOM", label: "Custom Unit" },
];

export const PRICING_TYPES = [
  { value: "QTY_RATE", label: "Standard (Qty × Rate)" },
  { value: "DIMENSION_RATE", label: "Dimensions (W × H × Qty × Rate)" },
  { value: "AREA_RATE", label: "Direct Area (Area × Rate)" },
];

export const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI / QR Code" },
  { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT/RTGS/IMPS)" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Credit / Debit Card" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export const EXPENSE_CATEGORIES = [
  "Raw Materials & Substrates",
  "Printing Media & Vinyls",
  "Ink & Toner Cartridges",
  "Hardware & Equipment",
  "Software Subscriptions (Adobe/Figma/Fonts)",
  "Freelancers & Outsourcing",
  "Office Rent & Maintenance",
  "Electricity & Utilities",
  "Marketing & Advertising",
  "Logistics & Delivery",
  "Miscellaneous Expenses"
];

export const ITEM_CATEGORIES = [
  "Branding & Logo Design",
  "Signage & Large Format Print",
  "Banner & Flex Printing",
  "Brochures & Marketing Collateral",
  "Packaging & Label Design",
  "Social Media & Digital Creatives",
  "UI/UX & Web Design",
  "Stationery & Business Cards",
  "Photography & Vector Art",
  "Custom Printing & Fabrication"
];

export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Indian Rupee Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return `${tens[ten]}${unit > 0 ? ' ' + ones[unit] : ''}`;
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let res = '';
    if (hundred > 0) {
      res += `${ones[hundred]} Hundred`;
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let crore = Math.floor(integerPart / 10000000);
  let lakh = Math.floor((integerPart % 10000000) / 100000);
  let thousand = Math.floor((integerPart % 100000) / 1000);
  let hundred = integerPart % 1000;

  let words = '';

  if (crore > 0) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (hundred > 0) {
    words += `${convertThreeDigits(hundred)} `;
  }

  words = words.trim();
  if (!words) words = 'Zero';

  let result = `Indian Rupee ${words}`;
  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }
  result += ' Only';

  return result;
}
