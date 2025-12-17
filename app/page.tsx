'use client';

import { useState } from 'react';
import { ParsedItem, CatalogMatch, QuoteData, AgentResponse } from '@/types';
import { generateQuotePDF } from '@/lib/pdfGenerator';

const EXAMPLE_REQUEST = `Hi, I need a quote for the following items for our maintenance shop:

15 pairs of work gloves, large size, nitrile coating preferred
3 boxes of 1/2 inch hex bolts, grade 8 if you have them
10 safety glasses with anti-fog lenses
2 gallons of industrial degreaser
1 box of electrical tape, black
5 cans spray paint, gloss black
25 cut-off wheels, 4 inch for metal work
1 adjustable wrench, 10 inch
8 rolls duct tape, 2 inch wide
Lithium grease cartridges - need about 6

Ship to our facility in Rockford. Let me know pricing and availability.

Thanks,
Mike`;

export default function Home() {
  const [step, setStep] = useState<'input' | 'review' | 'quote'>('input');
  const [requestText, setRequestText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Agent response data
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [matches, setMatches] = useState<Record<number, CatalogMatch[]>>({});
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  
  // Quote data
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [emailSummary, setEmailSummary] = useState<string>('');

  const handleAnalyze = async () => {
    if (!requestText.trim()) {
      setError('Please enter a request');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          rawRequest: requestText,
          customerTier: 'standard',
        }),
      });

      const data: AgentResponse = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.parsedItems && data.matches) {
        setParsedItems(data.parsedItems);
        setMatches(data.matches);
        setClarifyingQuestions(data.clarifyingQuestions || []);
        
        // Initialize selected SKUs with best matches or NEEDS-REVIEW
        const initialSelections = data.parsedItems.map((_, i) => {
          const itemMatches = data.matches![i];
          return itemMatches.length > 0 ? itemMatches[0].sku : 'NEEDS-REVIEW';
        });
        setSelectedSkus(initialSelections);
        
        setStep('review');
      }
    } catch (err) {
      setError('Failed to analyze request. Please check your API key and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          parsedItems,
          selectedSkus,
          customerTier: 'standard',
        }),
      });

      const data: AgentResponse = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.quote) {
        setQuote(data.quote);
        setEmailSummary(data.emailSummary || '');
        setStep('quote');
      }
    } catch (err) {
      setError('Failed to generate quote. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    
    const blob = generateQuotePDF(quote);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quote.quoteNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailSummary);
    alert('Email summary copied to clipboard!');
  };

  const handleReset = () => {
    setStep('input');
    setRequestText('');
    setParsedItems([]);
    setMatches({});
    setSelectedSkus([]);
    setQuote(null);
    setEmailSummary('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4">Riverhawk AI Quote Builder</h1>
          <p className="text-xl text-blue-100">
            Transform messy customer requests into accurate quotes in seconds
          </p>
        </div>
      </header>

      {/* What It Does Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What It Does</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Extracts Items</h3>
              <p className="text-gray-600">
                AI parses unstructured emails, punch lists, or BOMs to identify requested products and quantities
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Matches Catalog</h3>
              <p className="text-gray-600">
                Intelligent search matches requests to your catalog, suggests alternates when exact matches aren't found
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Generates Quotes</h3>
              <p className="text-gray-600">
                Creates professional PDF quotes with pricing, totals, and ready-to-send email summaries
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Interactive Demo</h2>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {step === 'input' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Step 1: Paste Customer Request
                </label>
                <textarea
                  className="w-full h-64 border border-gray-300 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste email, punch list, or type line items..."
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setRequestText(EXAMPLE_REQUEST)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Load Example
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !requestText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Analyzing...' : 'Analyze Request →'}
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Step 2: Review Extracted Items</h3>
                
                {clarifyingQuestions.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Clarifying Questions:</h4>
                    <ul className="list-disc list-inside text-yellow-800 space-y-1">
                      {clarifyingQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Qty</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Matched Product</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{i + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {item.qty} {item.unit}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <select
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={selectedSkus[i]}
                              onChange={(e) => {
                                const newSelections = [...selectedSkus];
                                newSelections[i] = e.target.value;
                                setSelectedSkus(newSelections);
                              }}
                            >
                              {matches[i]?.map((match) => (
                                <option key={match.sku} value={match.sku}>
                                  {match.name} - ${match.listPrice} ({match.reason})
                                </option>
                              ))}
                              <option value="NEEDS-REVIEW">⚠️ Needs Manual Review</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  ← Start Over
                </button>
                <button
                  onClick={handleGenerateQuote}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 font-semibold"
                >
                  {loading ? 'Generating...' : 'Generate Quote →'}
                </button>
              </div>
            </div>
          )}

          {step === 'quote' && quote && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Step 3: Your Quote is Ready!</h3>
                
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Quote Number</p>
                      <p className="font-semibold text-lg">{quote.quoteNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold text-lg">{quote.date}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-300 pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${quote.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Tax (8%):</span>
                      <span className="font-semibold">${quote.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t border-blue-300 pt-2">
                      <span>Total:</span>
                      <span>${quote.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">SKU</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Extended</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lineItems.map((item) => (
                        <tr key={item.lineNumber} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">{item.lineNumber}</td>
                          <td className="border border-gray-300 px-3 py-2 font-mono">{item.sku}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.description}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.qty} {item.unit}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-semibold">${item.extendedPrice.toFixed(2)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {item.status === 'needs-review' && <span className="text-red-600">⚠️</span>}
                            {item.status === 'alternate' && <span className="text-yellow-600">Alt</span>}
                            {item.status === 'matched' && <span className="text-green-600">✓</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-2">Email Summary</h4>
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border border-gray-300 overflow-auto max-h-64">
                    {emailSummary}
                  </pre>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    ← New Quote
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={handleCopyEmail}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    📋 Copy Email
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Uses AI Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Uses AI</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Claude Sonnet 4 LLM</h3>
                <p className="text-gray-600">
                  Uses Anthropic's Claude API to generate contextual clarifying questions when catalog matches are ambiguous or confidence is low
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Keyword-Based Matching</h3>
                <p className="text-gray-600">
                  Deterministic catalog search using weighted keyword scoring ensures reliable, explainable matches without hallucination
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Multi-Step Agent Workflow</h3>
                <p className="text-gray-600">
                  Orchestrated process: parse request → search catalog → validate matches → calculate pricing → generate deliverables
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Important Limitations</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Prototype Only:</strong> This uses a small sample catalog with fictional SKUs. Not connected to real Riverhawk ERP or inventory systems.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>Manual Verification Required:</strong> All quotes must be reviewed and approved by a sales representative before sending to customers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>No Real-Time Inventory:</strong> Availability and pricing are simulated. Actual stock levels must be confirmed separately.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>AI Limitations:</strong> AI may misinterpret ambiguous requests. Items marked "Needs Review" require human judgment.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span><strong>No Data Retention:</strong> Requests and quotes are not saved. Download PDFs and save locally if needed.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Speed Up Your Quoting?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Contact us to discuss integrating AI quote assistance into your workflow
          </p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
            Contact Riverhawk Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>© 2024 Riverhawk Company. This is a prototype demonstration.</p>
          <p className="text-sm mt-2">Built with Next.js, TypeScript, Tailwind CSS, and Claude AI</p>
        </div>
      </footer>
    </div>
  );
}
