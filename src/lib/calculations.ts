export interface LineItemCalculationInput {
  pricingType: 'QTY_RATE' | 'DIMENSION_RATE' | 'AREA_RATE' | string;
  unit: string;
  width?: number | null;
  height?: number | null;
  quantity?: number | null;
  area?: number | null;
  rate: number;
  discount?: number | null; // percentage e.g. 10 for 10%
  taxRate?: number | null; // percentage e.g. 18 for 18%
}

export interface LineItemCalculationResult {
  computedArea: number;
  effectiveQuantity: number;
  baseAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Calculates Area and Total line amount dynamically for graphic design orders/invoices.
 * For example, a 10 ft x 5 ft banner @ 2 pcs = 100 sq ft @ Rs 25/sq ft.
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const qty = Number(input.quantity) > 0 ? Number(input.quantity) : 1;
  const rate = Number(input.rate) || 0;
  const discountPct = Number(input.discount) || 0;
  const taxPct = Number(input.taxRate) || 0;

  let computedArea = 0;
  let effectiveQty = qty;
  let baseAmount = 0;

  if (input.pricingType === 'DIMENSION_RATE') {
    const width = Number(input.width) || 0;
    const height = Number(input.height) || 0;

    // Convert dimensions according to unit
    // If unit is FOOT or SQ_FT, area is width * height
    // If unit is INCH, width (in) * height (in) / 144 = sq ft or in sq inch
    if (input.unit === 'INCH') {
      computedArea = (width * height) / 144; // standard square feet conversion for printing industry
    } else if (input.unit === 'CM') {
      computedArea = (width * height) / 10000; // sq meter
    } else if (input.unit === 'MM') {
      computedArea = (width * height) / 1000000; // sq meter
    } else {
      computedArea = width * height;
    }

    // Effective billable area for all quantities
    const totalArea = computedArea * qty;
    effectiveQty = totalArea;
    baseAmount = totalArea * rate;
  } else if (input.pricingType === 'AREA_RATE') {
    computedArea = Number(input.area) || 0;
    const totalArea = computedArea * qty;
    effectiveQty = totalArea;
    baseAmount = totalArea * rate;
  } else {
    // QTY_RATE standard
    effectiveQty = qty;
    baseAmount = qty * rate;
  }

  // Calculate discount
  const discountAmount = (baseAmount * discountPct) / 100;
  const taxableAmount = Math.max(0, baseAmount - discountAmount);

  // Calculate GST/Tax
  const taxAmount = (taxableAmount * taxPct) / 100;
  const totalAmount = taxableAmount + taxAmount;

  return {
    computedArea: Number(computedArea.toFixed(4)),
    effectiveQuantity: Number(effectiveQty.toFixed(4)),
    baseAmount: Number(baseAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

export interface DocumentTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export function calculateDocumentTotals(items: LineItemCalculationInput[]): DocumentTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  for (const item of items) {
    const calc = calculateLineItem(item);
    subtotal += calc.taxableAmount; // standard subtotal (taxable value)
    discountTotal += calc.discountAmount;
    taxTotal += calc.taxAmount;
    grandTotal += calc.totalAmount;
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

/**
 * Validates partner profit sharing percentages.
 * Total active partner percentages must equal 100% exactly (with a 0.01 tolerance for floating point).
 */
export function validatePartnerPercentages(partners: { profitPercentage: number; isActive: boolean }[]): {
  isValid: boolean;
  totalPercentage: number;
  error?: string;
} {
  const activePartners = partners.filter((p) => p.isActive);
  const totalPercentage = activePartners.reduce((acc, p) => acc + (Number(p.profitPercentage) || 0), 0);
  const roundedTotal = Number(totalPercentage.toFixed(2));

  if (activePartners.length === 0) {
    return {
      isValid: false,
      totalPercentage: 0,
      error: 'At least one active partner is required.',
    };
  }

  if (Math.abs(roundedTotal - 100) > 0.01) {
    return {
      isValid: false,
      totalPercentage: roundedTotal,
      error: `Total active partner profit sharing percentage is ${roundedTotal}%. It must be EXACTLY 100.00%.`,
    };
  }

  return {
    isValid: true,
    totalPercentage: roundedTotal,
  };
}

/**
 * Calculates net profit and per-partner distribution.
 */
export function calculatePartnerProfits(
  netProfit: number,
  partners: { id: string; name: string; profitPercentage: number; isActive: boolean }[]
) {
  const activePartners = partners.filter((p) => p.isActive);
  return activePartners.map((partner) => {
    const sharePct = Number(partner.profitPercentage) || 0;
    const shareAmount = (netProfit * sharePct) / 100;
    return {
      ...partner,
      shareAmount: Number(shareAmount.toFixed(2)),
    };
  });
}
