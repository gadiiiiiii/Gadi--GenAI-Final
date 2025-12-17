export interface CatalogItem {
  sku: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  listPrice: number;
  keywords: string[];
}

export interface ParsedItem {
  description: string;
  qty: number;
  unit: string;
  partNumberHint: string;
  notes: string;
}

export interface CatalogMatch {
  sku: string;
  name: string;
  brand: string;
  unit: string;
  listPrice: number;
  score: number;
  reason: string;
}

export interface QuoteLineItem {
  lineNumber: number;
  description: string;
  qty: number;
  unit: string;
  sku: string;
  unitPrice: number;
  extendedPrice: number;
  status: 'matched' | 'alternate' | 'needs-review';
  matchReason?: string;
}

export interface QuoteData {
  quoteNumber: string;
  date: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface AgentResponse {
  parsedItems?: ParsedItem[];
  matches?: Record<number, CatalogMatch[]>;
  clarifyingQuestions?: string[];
  quote?: QuoteData;
  emailSummary?: string;
  error?: string;
}

export type CustomerTier = 'standard' | 'preferred' | 'premium';
