import catalogData from '../data/seedCatalog.json';
import { CatalogItem, ParsedItem, CatalogMatch, QuoteLineItem, QuoteData, CustomerTier } from '../types';

const catalog: CatalogItem[] = catalogData as CatalogItem[];

/**
 * parseRequestTool - Extract structured line items from raw text
 */
export function parseRequestTool(rawText: string): ParsedItem[] {
  const lines = rawText.split('\n').filter(line => line.trim().length > 0);
  const items: ParsedItem[] = [];

  for (const line of lines) {
    // Skip header lines or very short lines
    if (line.length < 5 || /^(item|description|qty|quantity|part)/i.test(line.trim())) {
      continue;
    }

    // Try to extract quantity
    const qtyMatch = line.match(/(\d+)\s*(ea|each|box|pc|pcs|pieces|pair|roll|can|bottle|gallon|tube|set|pack|ft|feet)?/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

    // Try to extract part number hints (SKU-like patterns or alphanumeric codes)
    const partMatch = line.match(/([A-Z]{2,}-[A-Z0-9]+-\d+|[A-Z0-9]{5,})/);
    const partNumberHint = partMatch ? partMatch[1] : '';

    // Look for "or equivalent" or "substitute ok" notes
    const equivalentMatch = line.match(/(or equivalent|substitute ok|similar ok|alternate acceptable)/i);
    const notes = equivalentMatch ? equivalentMatch[1] : '';

    // Extract description (remove qty and part numbers)
    let description = line
      .replace(/^\d+\s*/, '') // Remove leading numbers
      .replace(/\s*(ea|each|box|pc|pcs|pieces|pair|roll|can|bottle|gallon|tube|set|pack|ft|feet)\s*/gi, '')
      .replace(/[A-Z]{2,}-[A-Z0-9]+-\d+/g, '')
      .replace(/(or equivalent|substitute ok|similar ok|alternate acceptable)/gi, '')
      .trim();

    if (description.length > 3) {
      items.push({
        description,
        qty,
        unit: qtyMatch?.[2] || 'each',
        partNumberHint,
        notes,
      });
    }
  }

  return items;
}

/**
 * catalogSearchTool - Search catalog for matches using keyword scoring
 */
export function catalogSearchTool(itemDescription: string, partNumberHint?: string): CatalogMatch[] {
  const searchTerms = itemDescription.toLowerCase().split(/\s+/);
  const matches: Array<CatalogMatch & { rawScore: number }> = [];

  // If there's a part number hint, try exact SKU match first
  if (partNumberHint) {
    const exactMatch = catalog.find(item => item.sku === partNumberHint);
    if (exactMatch) {
      return [{
        sku: exactMatch.sku,
        name: exactMatch.name,
        brand: exactMatch.brand,
        unit: exactMatch.unit,
        listPrice: exactMatch.listPrice,
        score: 100,
        reason: 'Exact SKU match'
      }];
    }
  }

  for (const item of catalog) {
    let score = 0;
    const itemText = `${item.name} ${item.brand} ${item.category} ${item.keywords.join(' ')}`.toLowerCase();

    // Score based on term matches
    for (const term of searchTerms) {
      if (term.length < 3) continue; // Skip short terms
      if (itemText.includes(term)) {
        score += 10;
        // Bonus for exact word matches
        const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (wordRegex.test(itemText)) {
          score += 5;
        }
      }
    }

    // Bonus for category match
    if (searchTerms.some(term => item.category.toLowerCase().includes(term))) {
      score += 15;
    }

    // Bonus for brand match
    if (searchTerms.some(term => item.brand.toLowerCase().includes(term))) {
      score += 10;
    }

    if (score > 15) { // Threshold for relevance
      matches.push({
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        unit: item.unit,
        listPrice: item.listPrice,
        score,
        rawScore: score,
        reason: score > 40 ? 'Strong match' : score > 25 ? 'Good match' : 'Possible match'
      });
    }
  }

  // Sort by score descending and return top 5
  matches.sort((a, b) => b.rawScore - a.rawScore);
  return matches.slice(0, 5).map(({ rawScore, ...match }) => match);
}

/**
 * pricingTool - Calculate unit and extended prices with tier discounts
 */
export function pricingTool(sku: string, qty: number, customerTier: CustomerTier = 'standard'): {
  unitPrice: number;
  extendedPrice: number;
} {
  const item = catalog.find(i => i.sku === sku);
  if (!item) {
    return { unitPrice: 0, extendedPrice: 0 };
  }

  // Apply tier discounts
  const tierDiscounts = {
    standard: 1.0,
    preferred: 0.90, // 10% discount
    premium: 0.85,   // 15% discount
  };

  const unitPrice = item.listPrice * tierDiscounts[customerTier];
  const extendedPrice = unitPrice * qty;

  return {
    unitPrice: parseFloat(unitPrice.toFixed(2)),
    extendedPrice: parseFloat(extendedPrice.toFixed(2)),
  };
}

/**
 * quoteRendererTool - Generate final quote structure with totals
 */
export function quoteRendererTool(lineItems: QuoteLineItem[]): QuoteData {
  const subtotal = lineItems.reduce((sum, item) => sum + item.extendedPrice, 0);
  const taxRate = 0.08; // 8% sales tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const quoteNumber = `RH-Q-${Date.now().toString().slice(-8)}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    quoteNumber,
    date,
    lineItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Generate email summary from quote data
 */
export function generateEmailSummary(quote: QuoteData): string {
  const itemCount = quote.lineItems.length;
  const needsReview = quote.lineItems.filter(item => item.status === 'needs-review').length;

  let summary = `Quote ${quote.quoteNumber} - ${quote.date}\n\n`;
  summary += `Thank you for your inquiry. Please find your quote summary below:\n\n`;
  summary += `Total Items: ${itemCount}\n`;
  summary += `Subtotal: $${quote.subtotal.toFixed(2)}\n`;
  summary += `Tax (8%): $${quote.tax.toFixed(2)}\n`;
  summary += `Total: $${quote.total.toFixed(2)}\n\n`;

  if (needsReview > 0) {
    summary += `⚠️ ${needsReview} item(s) marked as "Needs Review" - please contact us for clarification.\n\n`;
  }

  summary += `Key Items:\n`;
  quote.lineItems.slice(0, 5).forEach(item => {
    summary += `• ${item.qty} ${item.unit} - ${item.description} (${item.sku}): $${item.extendedPrice.toFixed(2)}\n`;
  });

  if (quote.lineItems.length > 5) {
    summary += `... and ${quote.lineItems.length - 5} more item(s)\n`;
  }

  summary += `\nPlease review and let us know if you have any questions.\n\n`;
  summary += `Best regards,\nRiverhawk Inside Sales Team`;

  return summary;
}
