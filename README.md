# Riverhawk AI Quote Builder

An AI-powered web application that transforms unstructured customer requests into accurate, professional quotes in seconds.

## Overview

This prototype demonstrates how AI can assist inside sales representatives in building quotes from messy inputs like emails, punch lists, or BOMs. The system extracts items, matches them against a catalog, suggests alternatives, and generates complete quotes with PDFs and email summaries.

## Features

- **Intelligent Request Parsing**: Extracts product descriptions, quantities, and part number hints from unstructured text
- **Catalog Matching**: Uses keyword-based scoring to find the best matches from your product catalog
- **AI-Powered Clarification**: Generates contextual questions when matches are ambiguous
- **Alternate Suggestions**: Proposes substitute products when exact matches aren't available
- **Professional Output**: Creates PDF quotes and ready-to-send email summaries
- **Safety Guardrails**: Never invents SKUs; items without good matches are flagged for manual review

## How to Run

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key (get one at https://console.anthropic.com/)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Add your Anthropic API key to `.env`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using the Demo

1. **Paste a Request**: Copy a customer email or type line items. Click "Load Example" to see a sample request.
2. **Analyze**: Click "Analyze Request" to extract items and find catalog matches.
3. **Review Matches**: Verify or adjust the matched products using the dropdowns.
4. **Generate Quote**: Click "Generate Quote" to create the final PDF and email summary.
5. **Download/Copy**: Download the PDF or copy the email summary to clipboard.

## AI Usage Explanation

### Where AI is Used

This application uses Claude (Anthropic's LLM) for **one specific purpose**: generating clarifying questions when catalog matches are ambiguous or low-confidence.

**Example**: If a customer requests "work gloves" without specifying size or type, and we find multiple matches, Claude generates a contextual question like: "For the work gloves, do you need cut-resistant (A4 level) or standard nitrile-coated? Also, what size?"

### Where AI is NOT Used (and Why)

- **Request Parsing**: Uses deterministic regex-based extraction for reliability
- **Catalog Matching**: Uses weighted keyword scoring, not AI, to ensure explainable and consistent results
- **Pricing Calculation**: Pure computational logic based on customer tier and quantity
- **Quote Generation**: Template-based PDF creation with no LLM involvement

This hybrid approach balances AI's language understanding with deterministic reliability where accuracy is critical.

### API Configuration

The app uses:
- **Model**: `claude-sonnet-4-20250514` (Claude Sonnet 4)
- **Max Tokens**: 2000 per request
- **Rate Limiting**: 10 requests per minute per IP (in-memory, development only)

## Limitations

### Prototype Constraints

- **Sample Data**: Uses 42 fictional catalog items. Not connected to real ERP systems.
- **No Persistence**: Quotes are not saved. Download PDFs to keep records.
- **No Real Inventory**: Availability and stock levels are not checked.
- **Manual Verification Required**: All quotes must be reviewed by a sales rep before sending.

### Technical Limitations

- **No Authentication**: Anyone with the URL can access the tool.
- **No Multi-User Support**: Rate limiting is basic; not suitable for production.
- **Client-Side PDF Generation**: Large quotes may cause browser performance issues.
- **No Version Control**: Quote revisions are not tracked.

### AI Limitations

- May misinterpret ambiguous descriptions
- Clarifying questions are only as good as the context provided
- Cannot access external product databases or specifications
- Does not learn from past quotes or user corrections

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API (Claude Sonnet 4)
- **PDF Generation**: jsPDF with autotable plugin
- **Deployment**: Designed for local development (can be deployed to Vercel, etc.)

## Project Structure

```
riverhawk-quote-builder/
├── app/
│   ├── api/quote/route.ts      # API endpoint for quote processing
│   ├── page.tsx                 # Main UI component
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── lib/
│   ├── agentTools.ts            # Core agent functions (parse, search, price)
│   ├── aiAgent.ts               # AI orchestration and Claude API calls
│   └── pdfGenerator.ts          # PDF creation utility
├── types/
│   └── index.ts                 # TypeScript type definitions
├── data/
│   └── seedCatalog.json         # Sample product catalog
└── [config files]
```

## Security Considerations

- API key must be kept secret (never commit `.env` to git)
- Rate limiting is basic; production use requires robust solutions
- No input sanitization beyond basic validation
- No audit logging of quote generation

## Future Enhancements

See `prd_final.md` for the complete product roadmap.

## Demo Video

[Link to demo video - to be added]

## License

This is a prototype for educational and demonstration purposes.

## Contact

For questions or to discuss production implementation, contact Riverhawk Sales.
