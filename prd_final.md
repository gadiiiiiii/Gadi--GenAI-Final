# Product Requirements Document: Riverhawk AI Quote Builder

## Product Overview

The Riverhawk AI Quote Builder is an assistive tool that helps inside sales representatives transform unstructured customer requests into professional quotes. By combining AI-powered language understanding with deterministic catalog matching, the system accelerates the quoting process while maintaining accuracy and control.

**Target Users**: Riverhawk inside sales reps and customer service representatives who build quotes for contractors, maintenance teams, and industrial customers.

**Core Problem Solved**: Quoting is slow because customer requests arrive in unstructured formats (emails, phone notes, handwritten lists), part numbers are inconsistent, substitutions happen frequently, and reps waste time searching catalogs and verifying details.

## Core Features and Status

### ✅ Phase 1: Request Parsing (Completed)

**Status**: Fully implemented and tested

**Features**:
- Extracts product descriptions from multi-line text input
- Identifies quantities and units (ea, box, pair, roll, etc.)
- Captures part number hints (SKU-like patterns)
- Detects "or equivalent" language and substitution notes
- Handles common variations in formatting and punctuation

**Implementation**: Deterministic regex-based parser in `lib/agentTools.ts::parseRequestTool()`

### ✅ Phase 2: Catalog Matching (Completed)

**Status**: Fully implemented with 42-item seed catalog

**Features**:
- Keyword-based scoring algorithm
- Weighted scoring: exact word matches, category matches, brand matches
- Returns top 5 matches per item with confidence scores
- SKU exact-match shortcut when part numbers are provided
- Never invents or hallucinates SKUs

**Implementation**: Deterministic search in `lib/agentTools.ts::catalogSearchTool()`

**Catalog Data**: `/data/seedCatalog.json` - 42 fictional but realistic industrial supply items across 12 categories

### ✅ Phase 3: AI Clarification (Completed)

**Status**: Implemented using Claude Sonnet 4

**Features**:
- Generates contextual clarifying questions when matches are ambiguous
- Only invoked when confidence score < 30 or no matches found
- Questions reference available alternates and ask about specifications
- Fallback to generic questions if AI call fails

**Implementation**: AI orchestrator in `lib/aiAgent.ts::runQuoteAgent()`

**AI Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)

### ✅ Phase 4: Pricing and Quote Generation (Completed)

**Status**: Fully implemented with tier-based pricing

**Features**:
- Customer tier discounts (Standard, Preferred 10%, Premium 15%)
- Unit and extended price calculations
- Automatic sales tax calculation (8%)
- Quote numbering with timestamp-based IDs
- Status tracking (matched, alternate, needs-review)

**Implementation**: 
- Pricing: `lib/agentTools.ts::pricingTool()`
- Quote rendering: `lib/agentTools.ts::quoteRendererTool()`

### ✅ Phase 5: Output Generation (Completed)

**Status**: Fully implemented

**Features**:
- Professional PDF quote generation with company branding
- Tabular line items with SKU, description, quantity, pricing
- Subtotal, tax, and grand total calculations
- Status indicators for items needing review
- Email summary with quote highlights
- Copy-to-clipboard functionality

**Implementation**:
- PDF: `lib/pdfGenerator.ts` using jsPDF + autotable
- Email: `lib/agentTools.ts::generateEmailSummary()`

### ✅ Phase 6: User Interface (Completed)

**Status**: Single-page application with three-step workflow

**Features**:
- Landing page with hero, benefits, and demo sections
- Step 1: Text input with example loader
- Step 2: Review table with dropdown selectors for matches
- Step 3: Quote display with download and copy actions
- Error handling and loading states
- Responsive design

**Implementation**: `app/page.tsx` - React component with TypeScript

## AI Specification

### Model Selection

**Chosen Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)

**Rationale**:
- Strong language understanding for generating contextual questions
- Excellent instruction following for structured output
- Fast response times suitable for interactive use
- Cost-effective for the limited scope of AI usage

### AI Usage Boundaries

**Where AI IS Used**:
1. Generating clarifying questions when catalog matches are uncertain

**Where AI is NOT Used**:
- Request parsing (deterministic regex)
- Catalog searching (keyword scoring)
- SKU selection (never autonomous)
- Pricing calculation (pure math)
- PDF generation (template-based)

### Prompting Strategy

AI is given:
- The customer's original request description
- Available catalog matches (if any) with names and brands
- Clear instruction to generate one specific question about specifications or preferences

**Example Prompt**:
```
You are helping match a customer request to catalog items.
The customer requested: "work gloves large" (quantity: 15)

We found these possible matches but confidence is low:
- Nitrile Coated Work Gloves, Large (SafeGuard Pro)
- Cut Resistant Gloves Level A4, Medium (SafeGuard Pro)
- Leather Work Gloves, X-Large (DuraWear)

Generate a brief, specific clarifying question (one sentence) to help 
identify the correct product. Ask about specifications, brand preferences, 
or key features.
```

**Expected Response**:
"For the work gloves, do you need cut-resistant (A4 level) or standard nitrile-coated, and is large size confirmed?"

### Guardrails

1. **Never Autonomous SKU Selection**: AI does not choose SKUs; it only asks questions
2. **Fallback Questions**: If AI fails, use generic fallback questions
3. **Rate Limiting**: 10 requests per minute per IP
4. **Timeout Handling**: 30-second timeout on AI calls
5. **Error Graceful Degradation**: Quote generation proceeds even if clarification fails

## Technical Architecture

### Stack

- **Frontend**: React 18, Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **AI**: Anthropic Claude API (REST)
- **PDF**: jsPDF + jspdf-autotable (client-side)
- **Data**: Static JSON file (no database)

### Data Flow

```
User Input → parseRequestTool() → catalogSearchTool() → AI (if needed)
                                                            ↓
                                  User Confirms Selections ←
                                                            ↓
                    pricingTool() → quoteRendererTool() → PDF + Email
```

### API Endpoints

**POST /api/quote**

Request body (action: analyze):
```json
{
  "action": "analyze",
  "rawRequest": "string",
  "customerTier": "standard" | "preferred" | "premium"
}
```

Response:
```json
{
  "parsedItems": [...],
  "matches": {...},
  "clarifyingQuestions": [...]
}
```

Request body (action: generate):
```json
{
  "action": "generate",
  "parsedItems": [...],
  "selectedSkus": [...],
  "customerTier": "standard"
}
```

Response:
```json
{
  "quote": {...},
  "emailSummary": "string"
}
```

### Environment Variables

- `ANTHROPIC_API_KEY`: Required for AI functionality

### File Structure

See README.md for complete project structure.

## Prompting and Iteration Summary

### Development Approach

This prototype was built through an iterative process of planning, implementation, and refinement. AI assistance (Claude) was used extensively during development to generate code, debug issues, and optimize implementations.

### Example Prompts Used During Development

**Prompt 1: Initial Architecture**
```
"I need to build a Next.js web app that uses AI to help sales reps create quotes 
from messy customer emails. The app should parse requests, match products to a 
catalog, and generate PDF quotes. What's the best architecture? Should I use 
server actions or API routes? How should I structure the agent workflow?"
```

**Result**: Decided on API routes for better separation of concerns, agent orchestrator pattern with tool functions, and hybrid AI/deterministic approach.

**Prompt 2: Catalog Matching Algorithm**
```
"I have a product catalog with names, keywords, brands, and categories. I need 
to match customer descriptions to catalog items. Should I use AI for this or 
build a keyword-based scorer? What are the tradeoffs?"
```

**Result**: Implemented deterministic keyword scoring to avoid AI hallucination of SKUs, with weighted bonuses for category/brand matches.

**Prompt 3: PDF Generation**
```
"What's the best way to generate professional-looking PDF quotes in a Next.js 
app? Should I use a library or a service? I need it to work client-side and 
include tables with pricing."
```

**Result**: Chose jsPDF with autotable plugin for client-side generation, avoiding server dependencies and external API costs.

### Iteration Insights

1. **AI Scope Reduction**: Initially planned to use AI for catalog matching, but testing revealed hallucination risks. Pivoted to deterministic matching with AI only for clarification.

2. **UI Simplification**: Early designs had 5 steps; consolidated to 3 based on flow testing.

3. **Error Handling**: Added comprehensive error messages and fallbacks after discovering edge cases in request parsing.

## UX and Limitations

### User Experience Goals

1. **Speed**: Complete a quote in under 3 minutes
2. **Transparency**: Show all AI decisions and matches for user review
3. **Control**: User always confirms selections; AI never acts autonomously
4. **Trust**: Clear disclaimers about prototype status and manual verification requirements

### Achieved UX

- Single-page flow minimizes navigation
- Example request loads instantly for demo purposes
- Dropdown selectors make corrections easy
- One-click PDF download and email copy
- Visual status indicators (✓, ⚠️, Alt) at a glance

### Known Limitations

**Functional**:
- No real ERP integration
- No quote history or versioning
- No customer database lookup
- No inventory checking
- No multi-currency support

**Technical**:
- No authentication or authorization
- Basic rate limiting (not production-ready)
- No server-side validation of SKUs
- PDF generation may struggle with 100+ line items

**AI-Specific**:
- Clarifying questions limited by catalog context
- Cannot learn from user corrections
- May miss nuanced product requirements
- English-only support

### Safety Considerations

- All quotes flagged as "AI-assisted, requires verification"
- Items without good matches explicitly marked "Needs Review"
- No automatic order placement or customer communication
- API key must be secured server-side

## Future Roadmap

### Phase 7: ERP Integration (Not Implemented)

- Connect to Riverhawk's actual product database
- Real-time inventory availability checks
- Customer account lookup and pricing tier automation
- Historical quote retrieval

### Phase 8: Enhanced AI Features (Not Implemented)

- Learn from accepted/rejected matches to improve scoring
- Multi-language support for international customers
- Automatic product recommendations based on quote history
- Technical specification extraction from datasheets

### Phase 9: Collaboration Features (Not Implemented)

- Internal comments and approvals workflow
- Customer-facing quote portal with accept/reject
- Email integration for automatic request ingestion
- Slack notifications for quote status changes

### Phase 10: Analytics and Optimization (Not Implemented)

- Quote conversion tracking
- Most common substitutions report
- Average quote build time metrics
- AI question effectiveness analysis

## Success Metrics

For prototype evaluation:

1. **Time to Quote**: Can a rep build a 10-item quote in under 3 minutes?
2. **Match Accuracy**: Are 80%+ of matched items correct without modification?
3. **Usability**: Can a new user complete the flow without instructions?
4. **Trust**: Do reps feel confident reviewing AI-assisted quotes?

For production deployment:

1. Quote build time reduced by 50%
2. Quote accuracy maintained at 95%+
3. 70% adoption rate among sales team within 90 days
4. Zero incorrect quotes sent to customers due to AI errors

## Conclusion

This prototype demonstrates that AI can meaningfully accelerate the quoting process when combined with deterministic logic for critical operations. The hybrid approach maintains reliability while leveraging AI's language understanding strengths. The system is ready for internal testing and user feedback to inform production development decisions.
