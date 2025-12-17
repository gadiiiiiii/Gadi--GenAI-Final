import { NextRequest, NextResponse } from 'next/server';
import { runQuoteAgent, generateFinalQuote } from '@/lib/aiAgent';
import { CustomerTier } from '@/types';

// Simple rate limiting (in-memory)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, rawRequest, parsedItems, selectedSkus, customerTier } = body;

    if (action === 'analyze') {
      if (!rawRequest || typeof rawRequest !== 'string') {
        return NextResponse.json(
          { error: 'Invalid request: rawRequest is required' },
          { status: 400 }
        );
      }

      const result = await runQuoteAgent(rawRequest, customerTier as CustomerTier);
      return NextResponse.json(result);
    }

    if (action === 'generate') {
      if (!parsedItems || !selectedSkus) {
        return NextResponse.json(
          { error: 'Invalid request: parsedItems and selectedSkus are required' },
          { status: 400 }
        );
      }

      const result = await generateFinalQuote(parsedItems, selectedSkus, customerTier as CustomerTier);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "analyze" or "generate".' },
      { status: 400 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
