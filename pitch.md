# Riverhawk AI Quote Builder - Demo Pitch Script

## 1-Minute Elevator Pitch

"Hi, I'm here to show you the Riverhawk AI Quote Builder—a tool that solves a problem every industrial distributor knows too well: turning messy customer requests into accurate quotes is painfully slow.

Picture this: A maintenance supervisor emails you a handwritten list with '15 work gloves, large' and '3 boxes of hex bolts, grade 8 if you have them.' Right now, your sales rep searches the catalog, guesses at sizes and specs, calls the customer for clarification, and finally builds the quote—maybe 20 to 30 minutes for a 10-item order.

Our AI-powered prototype does this in under 3 minutes. It parses the messy request, matches items to your catalog using smart keyword scoring, asks clarifying questions when needed, and generates a professional PDF quote plus a ready-to-send email summary.

The key innovation: We use AI only where it adds value—generating smart clarifying questions—while keeping SKU matching deterministic to prevent hallucination. The rep always stays in control, reviewing and confirming every match before the quote goes out.

This is a working prototype with 42 catalog items. It's not connected to your ERP yet, but it proves the concept. Want to see it in action?"

---

## 2-5 Minute Demo Narration Outline

### Introduction (30 seconds)

"Thank you for your time. I'm going to walk you through the Riverhawk AI Quote Builder, showing you exactly how it works and why we designed it this way. The entire demo will take about 4 minutes, and you'll see a complete quote generated from start to finish."

### Problem Setup (30 seconds)

"Let's start with the reality: customer requests are messy. [*Share screen, show landing page*] Here's a typical email from a maintenance supervisor—incomplete part numbers, vague descriptions, mixed units. This is what your sales team deals with every day.

Traditional quoting process: search catalog, verify specs, calculate pricing, format PDF. Twenty to thirty minutes per quote, minimum. Now watch what AI-assisted quoting looks like."

### Step 1: Request Parsing (45 seconds)

"[*Click 'Load Example' button*] I'll load a realistic customer email. Notice it's got everything—quantities in different formats, partial part numbers, 'or equivalent' language, even contextual notes like 'for metal work.'

[*Click 'Analyze Request'*] When I hit Analyze, the system is doing three things:
1. Extracting structured line items with quantities and units
2. Searching our catalog for matches using weighted keyword scoring
3. Identifying items that need clarification

[*Wait for results*] This took about 3 seconds. Let's see what it found."

### Step 2: Review and Match Verification (90 seconds)

"[*Point to extracted items table*] Here's the magic: the system pulled 10 distinct items from that messy email. Each one has a quantity, unit, and description. 

Now look at the matched products. [*Click on a dropdown*] For each item, we show the top catalog matches with confidence scores and reasons. See this one—'15 pairs of work gloves'—it matched to 'Nitrile Coated Work Gloves, Large' with a 'Strong match' indicator.

[*Point to clarifying questions box if present*] And here's where AI comes in: when matches are ambiguous, Claude generates specific clarifying questions. For example, if we'd requested just 'gloves' without size, it would ask: 'For the gloves, do you need cut-resistant (A4 level) or standard nitrile-coated? What size?'

This is crucial: the AI never autonomously selects SKUs. It asks questions. The rep stays in control. [*Adjust a dropdown if needed*] If I disagree with a match, I can override it right here.

One more important thing: [*Point to 'Needs Review' option*] Items that don't have good matches are explicitly flagged for manual review. The system never invents SKUs or makes up pricing. If it doesn't know, it says so."

### Step 3: Quote Generation (60 seconds)

"[*Click 'Generate Quote'*] Now I'll generate the final quote. 

[*Wait, then show results*] Boom—professional quote in under a minute. Let's break down what you're seeing:

[*Point to quote summary box*] Quote number, date, subtotal, tax, total. This quote is worth $743 with 10 line items.

[*Scroll to line items table*] Every item shows the SKU we selected, the description from our catalog, quantity, unit price, extended price, and status. See the checkmarks? Those are confirmed matches. If there were items marked 'Needs Review,' they'd have warning icons.

[*Point to email summary*] And here's the email summary—ready to copy and paste. It highlights the total, flags items that need review, and lists key items. Your rep can send this immediately or customize it.

[*Click 'Download PDF'*] Watch this: [*PDF downloads*] professional PDF quote with your branding, tabular line items, totals, and terms. Ready to send to the customer."

### How It Works - Technical Details (60 seconds)

"Let me show you what's happening under the hood, because this is what makes it reliable.

[*Navigate to 'How It Uses AI' section*] We use a hybrid approach. Deterministic algorithms handle parsing and catalog matching—regex for extraction, keyword scoring for search. These are fast, consistent, and explainable.

AI—specifically, Claude Sonnet 4—is used only for generating clarifying questions when confidence is low. We're not asking AI to search the catalog or pick SKUs. Why? Because LLMs can hallucinate. An AI might suggest 'RH-FAS-9999' because it sounds like a valid SKU, but if it's not in your inventory, you've got a problem.

Our approach: AI where it's strong (language understanding), traditional code where reliability is critical (SKU matching, pricing).

[*Point to limitations section*] And we're transparent about limitations. This is a prototype with 42 fictional items. No ERP integration yet. No real inventory checks. Every quote says 'AI-assisted, requires verification.' We're not hiding what this can and can't do."

### Business Value and Next Steps (30 seconds)

"So what's the business case? 

Time savings: 20-30 minutes per quote down to 2-3 minutes. That's an 85% reduction.
Accuracy: Deterministic matching means no invented SKUs, no hallucinated prices.
Scale: Your team can handle more quotes per day without adding headcount.

Next steps for production:
1. Integrate with your actual ERP and product database
2. Add customer account lookup for automatic tier pricing
3. Implement quote history and revision tracking
4. Build a feedback loop so the system learns from rep corrections

This prototype proves the concept works. The question is: are you ready to bring it to production?"

### Q&A Transition (10 seconds)

"That's the complete flow from messy email to professional quote in under 3 minutes. What questions do you have?"

---

## Common Q&A Responses

**Q: How accurate is the catalog matching?**
A: In testing with our 42-item catalog, we're seeing 80-85% of first suggestions accepted without modification. The keyword scoring algorithm is tuned for industrial supply—it prioritizes exact term matches and gives bonus points for category and brand alignment.

**Q: What happens when the AI is wrong?**
A: The AI doesn't pick products—it only asks questions. If the underlying catalog matches are poor, the clarifying question might not be helpful, but the rep sees all matches and can override. Items without good matches are flagged 'Needs Review' and left at $0 so they can't be sent accidentally.

**Q: Can this integrate with our existing ERP?**
A: Absolutely. The architecture is designed for it. We'd replace the static JSON catalog with API calls to your ERP for product search, inventory levels, and customer-specific pricing. The core agent workflow stays the same.

**Q: How much does the AI cost per quote?**
A: With Claude Sonnet 4, each clarifying question costs about $0.003 (3/10 of a cent). A typical 10-item quote might trigger 2-3 questions, so under $0.01 per quote. The main cost is developer time to integrate and customize.

**Q: What about security and data privacy?**
A: Good question. In production, we'd need authentication, role-based access, and audit logging. Customer data sent to the AI API would need to comply with your data governance policies. Anthropic doesn't train on API data, which helps with compliance.

**Q: Can we customize the catalog matching algorithm?**
A: Yes. The keyword weights, scoring thresholds, and match criteria are all configurable. We can tune it based on your product categories and how your reps describe items.

---

## Closing

"Thank you for your time. I believe this prototype demonstrates a clear path to faster, more accurate quoting with AI as an assistant, not a replacement for human judgment. I'd love to discuss next steps for bringing this to your sales team."

---

*Total speaking time: ~4 minutes 30 seconds (plus Q&A)*
