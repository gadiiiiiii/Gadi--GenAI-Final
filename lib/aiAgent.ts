import { ParsedItem, CatalogMatch, QuoteLineItem, AgentResponse, CustomerTier } from '../types';
import { 
  parseRequestTool, 
  catalogSearchTool, 
  pricingTool, 
  quoteRendererTool,
  generateEmailSummary 
} from './agentTools';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Call Claude API with proper error handling and rate limiting
 */
async function callClaude(messages: ClaudeMessage[]): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Main agent orchestrator - coordinates parsing, matching, and quote generation
 */
export async function runQuoteAgent(
  rawRequest: string,
  customerTier: CustomerTier = 'standard'
): Promise<AgentResponse> {
  try {
    // Step 1: Parse the raw request
    console.log('Step 1: Parsing request...');
    const parsedItems = parseRequestTool(rawRequest);

    if (parsedItems.length === 0) {
      return {
        error: 'Could not extract any items from the request. Please ensure the input contains product descriptions and quantities.',
      };
    }

    // Step 2: Search catalog for each parsed item
    console.log('Step 2: Searching catalog...');
    const matches: Record<number, CatalogMatch[]> = {};
    const clarifyingQuestions: string[] = [];

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      const catalogMatches = catalogSearchTool(item.description, item.partNumberHint);
      matches[i] = catalogMatches;

      // If no good match or low confidence, generate clarifying question
      if (catalogMatches.length === 0 || (catalogMatches[0].score < 30 && catalogMatches.length > 1)) {
        // Use AI to generate a helpful clarifying question
        const questionPrompt = `You are helping match a customer request to catalog items. 
The customer requested: "${item.description}" (quantity: ${item.qty})

${catalogMatches.length > 0 ? `We found these possible matches but confidence is low:
${catalogMatches.map(m => `- ${m.name} (${m.brand})`).join('\n')}` : 'We found no matches in the catalog.'}

Generate a brief, specific clarifying question (one sentence) to help identify the correct product. Ask about specifications, brand preferences, or key features.`;

        try {
          const question = await callClaude([
            { role: 'user', content: questionPrompt }
          ]);
          clarifyingQuestions.push(`Item ${i + 1}: ${question.trim()}`);
        } catch (error) {
          clarifyingQuestions.push(`Item ${i + 1}: Could you provide more details about "${item.description}"? (e.g., size, brand, specifications)`);
        }
      }
    }

    // Return parsed items and matches for user review
    return {
      parsedItems,
      matches,
      clarifyingQuestions: clarifyingQuestions.length > 0 ? clarifyingQuestions : undefined,
    };

  } catch (error) {
    console.error('Agent error:', error);
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Generate final quote from confirmed selections
 */
export async function generateFinalQuote(
  parsedItems: ParsedItem[],
  selectedSkus: string[],
  customerTier: CustomerTier = 'standard'
): Promise<AgentResponse> {
  try {
    const lineItems: QuoteLineItem[] = [];

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      const selectedSku = selectedSkus[i];

      let status: QuoteLineItem['status'] = 'matched';
      let matchReason = 'Customer confirmed';

      if (!selectedSku || selectedSku === 'NEEDS-REVIEW') {
        status = 'needs-review';
        matchReason = 'No suitable match found - manual review required';
        
        lineItems.push({
          lineNumber: i + 1,
          description: item.description,
          qty: item.qty,
          unit: item.unit,
          sku: 'NEEDS-REVIEW',
          unitPrice: 0,
          extendedPrice: 0,
          status,
          matchReason,
        });
        continue;
      }

      // Get pricing
      const { unitPrice, extendedPrice } = pricingTool(selectedSku, item.qty, customerTier);

      // Get catalog match info
      const catalogMatches = catalogSearchTool(item.description, selectedSku);
      const match = catalogMatches.find(m => m.sku === selectedSku);

      if (match) {
        if (match.score < 40) {
          status = 'alternate';
          matchReason = 'Alternate product suggested';
        }

        lineItems.push({
          lineNumber: i + 1,
          description: match.name,
          qty: item.qty,
          unit: match.unit,
          sku: selectedSku,
          unitPrice,
          extendedPrice,
          status,
          matchReason: match.reason,
        });
      }
    }

    // Generate quote with totals
    const quote = quoteRendererTool(lineItems);
    const emailSummary = generateEmailSummary(quote);

    return {
      quote,
      emailSummary,
    };

  } catch (error) {
    console.error('Quote generation error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to generate quote',
    };
  }
}
