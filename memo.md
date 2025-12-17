# Building with Generative AI: Reflections and Learnings

## How I Used AI While Building This Prototype

Building the Riverhawk Quote Builder was an exercise in human-AI collaboration. I used Claude (ironically, the same model the app uses) as a development partner throughout the entire process, from architecture decisions to debugging edge cases. This memo reflects on that experience and the design choices that emerged.

### AI as Architecture Consultant

My first major decision was determining where AI should and shouldn't be used in the application itself. I prompted Claude extensively about tradeoffs:

"Should I use AI for catalog matching? What are the risks of hallucination? How can I build a reliable system that leverages AI's strengths without exposing users to its weaknesses?"

The answer wasn't immediately obvious. My initial instinct was to use AI for everything—parsing, matching, pricing, the works. But through iterative prompting and testing, I realized this would be a mistake. AI is brilliant at understanding language and context but terrible at being deterministic when you need exact matches. A sales rep can't send a quote with an invented SKU.

This led to the hybrid architecture: deterministic parsing and matching with AI only for clarification questions. The AI doesn't decide; it asks. This distinction is crucial.

### AI as Code Generator

I used AI heavily to generate boilerplate and implementation code. For example, when building the catalog search algorithm, I prompted:

"Write a TypeScript function that scores catalog items based on keyword matches, with bonus points for category and brand matches. Return the top 5 results sorted by score."

Claude generated working code in seconds. But here's the interesting part: I didn't just copy-paste it. I iterated, tested with edge cases, and refined the scoring weights based on actual catalog behavior. AI gave me a 90% solution instantly; I provided the final 10% of domain knowledge and testing.

This pattern repeated throughout development. AI wrote the PDF generation logic, the API route structure, the React component skeleton. I added the business logic, error handling, and UX polish.

### AI as Debugging Partner

When I encountered issues (and I did—many times), I would paste error messages and code snippets to Claude and ask for help. For instance:

"I'm getting a hydration mismatch error in Next.js when generating PDFs. The jsPDF library works fine on the client but breaks during SSR. How do I fix this?"

Claude suggested dynamic imports and client-side-only PDF generation, which solved the problem. This kind of rapid debugging would have taken me hours of Stack Overflow searching; instead, it took minutes.

### AI as Documentation Writer

I used AI to draft portions of the README and PRD. I would outline the structure and key points, then ask Claude to expand sections with proper formatting and detail. This was remarkably effective for technical documentation, though I still edited heavily for tone and accuracy.

## Why the AI Feature Is Designed This Way

The core AI feature—generating clarifying questions when matches are ambiguous—is deliberately narrow in scope. Here's why:

### Trust Through Transparency

Users need to trust the system. If AI autonomously selected SKUs, reps would spend just as much time verifying choices as they would have spent searching manually. By having AI ask questions instead of making decisions, we keep the human in control while still providing value.

The clarifying questions are visible in the UI, clearly attributed to the AI, and can be overridden. This transparency builds trust.

### Guardrails Against Hallucination

LLMs are prone to "hallucination"—generating plausible-sounding but incorrect information. For catalog matching, this would be catastrophic. Imagine if the system suggested "RH-FAS-4999" because it sounded like a reasonable SKU, but it doesn't exist in inventory.

By using deterministic keyword matching for SKU selection, we eliminate this risk entirely. The AI never sees the catalog; it only helps with language understanding. This architectural choice is the most important safety feature of the entire system.

### Balancing Speed and Accuracy

Early in development, I tested using AI for the entire matching process. It was slower (API round-trip time) and less consistent than keyword scoring. Sometimes it would pick the perfect match; other times, it would choose based on semantic similarity that didn't align with industrial supply conventions.

For example, when given "grease cartridge," AI might match "silicone sealant" because both are viscous substances in tubes. A keyword scorer correctly prioritizes "lithium grease cartridge" because it matches "grease" and "cartridge" exactly.

Speed matters in a sales tool. Reps won't use a system that makes them wait 10 seconds per item. Deterministic matching is instant; AI is reserved for when human judgment is actually needed.

### Cost Considerations

Every AI API call costs money. By limiting AI to clarification questions (invoked only when confidence is low), we minimize costs while maximizing value. In a typical 10-item quote, maybe 2-3 items need clarification. That's 2-3 API calls instead of 10+.

This design scales better economically and performs better technically.

## Risks and Tradeoffs

### Risks of the Current Design

**AI Question Quality**: The clarifying questions are only as good as the context provided. If the catalog matches are poor, the AI's question will be too. For example, if we match "gloves" to "safety glasses" because keywords align poorly, the AI will ask about glasses when the user wanted gloves.

**Mitigation**: The catalog search algorithm is crucial. We need high-quality keyword tagging and comprehensive product metadata. Future improvements should focus on better catalog data.

**Over-Reliance on AI**: There's a risk that users might trust AI-generated questions too much and not verify the underlying matches. If an AI asks "Do you want the blue or red model?" but the matched product is wrong entirely, the question misleads rather than helps.

**Mitigation**: The UI shows all matches with scores and reasons. Users can see why each match was suggested and override selections.

**API Dependency**: The system relies on Anthropic's API. If the service is down or rate-limited, clarification questions fail. The system degrades gracefully (uses fallback generic questions), but this is still a risk.

**Mitigation**: Cache common questions, implement retry logic, and display clear error messages when AI is unavailable.

### Tradeoffs Made

**Complexity vs. Capability**: I chose simplicity over sophistication. The keyword matching algorithm is straightforward, not a neural embedding-based semantic search. This means it might miss some matches that a more advanced system would catch.

**Justification**: Simplicity is debuggable, explainable, and maintainable. Sales reps can understand why "hex bolt" matched "Hex Bolt Grade 8" but didn't match "Machine Screw Phillips." With neural embeddings, matches would be black boxes.

**AI Scope vs. Demo Appeal**: A more impressive demo would have AI doing everything—parsing, matching, even drafting email prose. But that wouldn't be production-ready.

**Justification**: I prioritized building something that could realistically be deployed (with proper ERP integration) over something that looks flashy but is unreliable.

**No Learning/Feedback Loop**: The system doesn't learn from user corrections. If a rep consistently rejects AI suggestions for certain items, the system doesn't adapt.

**Justification**: This is a prototype. Implementing a feedback loop requires data storage, analytics infrastructure, and model fine-tuning—all beyond scope. But it's a clear next step for production.

## What I Learned Building with Generative AI

### 1. AI Is an Accelerant, Not a Replacement

AI didn't build this app for me. I built it with AI as a tool. The architecture, business logic, and design decisions all required human judgment. AI accelerated implementation but didn't substitute for domain knowledge or critical thinking.

The best use of AI in development is filling in the "obvious" code—boilerplate, standard patterns, simple algorithms—while the developer focuses on hard problems like business rules, UX flows, and system architecture.

### 2. Iterative Prompting Is a Skill

My first prompts were often too vague or too detailed. Over time, I learned to prompt effectively:
- Start broad ("What's the best approach to X?")
- Get specific with constraints ("Given that I need Y and Z, what should I do?")
- Iterate with feedback ("That didn't work because A; adjust for B")

Effective prompting requires understanding both the problem and the AI's capabilities. It's not natural language alone; it's a dialogue.

### 3. Trust But Verify Everything

AI-generated code often looks correct but has subtle bugs. I caught several issues during testing:
- Off-by-one errors in array indexing
- Missing null checks
- Incorrect TypeScript types that compiled but failed at runtime

Every AI-generated function needed manual review and testing. This is unavoidable and actually makes you a better developer—you understand the code more deeply when you verify it.

### 4. AI Shines at Structured Tasks

AI was most helpful for:
- Generating JSON schemas
- Writing API route boilerplate
- Creating React component structures
- Drafting documentation with clear outlines

AI struggled with:
- Understanding implicit business rules
- Debugging complex state management
- Choosing between multiple valid architectural approaches

The lesson: Use AI for well-defined, structured tasks. Don't expect it to understand nuanced requirements or make subjective design decisions.

### 5. Ethical Responsibility Increases

When you build AI-powered tools, you're responsible for how they're used and misused. The disclaimers in this app ("requires manual verification," "AI-assisted") are not just legal CYA—they're ethical necessities.

If a sales rep sends an incorrect quote because the AI suggested the wrong product, whose fault is it? The tool builder (me) has a responsibility to design for safe use, including guardrails, transparency, and clear limitations.

### 6. The Future Is Hybrid Systems

Pure AI solutions are rarely the answer. Pure traditional solutions are increasingly slow to build. The future is hybrid: AI for language understanding, traditional code for reliability, humans for judgment.

This quote builder is a microcosm of that future. Deterministic algorithms handle SKU matching because precision matters. AI handles clarifying questions because language understanding is hard. Humans review everything because stakes are high.

### 7. Academic Integrity and Honest Use of AI

Throughout this project, I maintained academic integrity by:

**Transparency**: All AI-generated code was reviewed, understood, and tested before integration. I didn't blindly copy-paste solutions without comprehension.

**Attribution**: This memo and the PRD clearly document where and how AI was used in development. The application itself transparently labels AI-generated content (clarifying questions).

**Learning Focus**: Rather than using AI to skip learning, I used it to accelerate iteration cycles, allowing me to explore more architectural approaches and learn from comparing solutions.

**Original Thinking**: All strategic decisions—what to build, how to architect it, where to use AI, what tradeoffs to make—were mine. AI was a tool for implementation, not a substitute for critical thinking.

The distinction is important: Using AI to help write code you understand is legitimate; using AI to generate code you don't understand and claiming it as your own work is not. I ensured I could explain every line of code in this project and why it exists.

## Privacy, Security, and Data Considerations

### Data Handling

The current prototype handles sensitive business information:
- Customer requests may contain proprietary product specifications
- Quotes include pricing information that could be competitively sensitive
- API keys provide access to paid AI services

**Current State**:
- No data persistence (all processing happens in memory)
- No logging of customer requests or quotes
- API key stored server-side in environment variables (not exposed to client)
- No third-party analytics or tracking

**Production Requirements**:
- Encrypt data in transit (HTTPS)
- Implement proper session management
- Add audit logging for compliance
- Consider GDPR/CCPA implications for EU/California customers
- Rate limiting to prevent abuse

### AI-Specific Privacy Concerns

Every customer request sent for AI clarification goes to Anthropic's API. This means:
- Anthropic may see customer requests (per their privacy policy)
- Requests should be sanitized to remove customer names, contact info
- Consider on-premise AI models for highly sensitive industries

**Mitigation in Current Design**:
- AI only sees product descriptions, not full customer context
- No personally identifiable information (PII) is sent to AI
- API calls are stateless (no conversation history)

### Bias and Fairness

Potential bias issues in this system:

**Catalog Bias**: If the catalog over-represents certain brands or under-represents others, matches will be systematically biased. For example, if "generic" products aren't well-tagged, the system might always suggest premium brands.

**Language Bias**: The system is English-only and may not handle technical jargon from non-English-speaking customers well. AI clarifying questions are optimized for American English industrial supply terminology.

**Mitigation**:
- Regular audit of match acceptance/rejection rates by product category
- Multi-language support in future versions
- Diverse test cases including non-standard terminology

### Over-Reliance and Trust Calibration

The biggest risk is users trusting the system too much. If reps stop verifying AI-suggested matches, errors will reach customers.

**Design Features to Prevent Over-Reliance**:
- Explicit "AI-Assisted - Requires Manual Verification" labels
- Visual indicators (⚠️) for items needing review
- No automatic quote sending—always requires human approval
- Match confidence scores visible to users
- All alternates shown, not just the top match

**Training Requirements**:
- Sales reps must understand AI limitations
- Clear escalation path when AI suggestions seem wrong
- Regular accuracy audits to catch systematic errors



## Conclusion

Building this prototype taught me that AI in software development is neither a magic wand nor a threat to jobs. It's a powerful tool that shifts where developers spend their time. Instead of writing boilerplate, I focused on architecture. Instead of debugging syntax, I debugged logic.

The most important skill isn't prompt engineering—it's knowing when to use AI and when not to. In the Riverhawk Quote Builder, AI is a supporting actor, not the star. That's by design, and it's what makes the system trustworthy.

As AI tools improve, the temptation will be to use them everywhere. But the lesson from this project is clear: restraint is a feature, not a limitation. The best AI-powered applications are those that know exactly what AI should and shouldn't do.

## What I Would Teach Another Founder

If I were advising another founder on using GenAI tools effectively, here's what I'd emphasize:

**1. Define the "No AI Zone" First**
Before deciding what AI should do, decide what it absolutely should not do. In my case: never let AI invent SKUs. Identify your critical failure points where errors are unacceptable, and keep AI away from those decisions.

**2. Treat AI Output as a Draft, Not Truth**
Every piece of AI-generated code, text, or decision should be reviewed with skepticism. Ask: "Is this correct? Is this optimal? What edge cases might break this?" The best developers use AI for speed, then apply rigor.

**3. Start Deterministic, Add AI Sparingly**
Build the core functionality with traditional code first. Then identify specific pain points where AI could add value. Don't start with "how can I use AI?" Start with "what problem am I solving?" and only then ask if AI helps.

**4. Transparency Builds Trust**
If your product uses AI, tell users. Show them where AI is involved, what it's doing, and why they should (or shouldn't) trust it. Hidden AI feels creepy; transparent AI feels like a helpful assistant.

**5. Measure What Matters**
Don't measure "how much AI did we use?" Measure outcomes: Did it make users faster? More accurate? Happier? AI is a means, not an end.

## Impact on My Future Work

This project fundamentally changed how I think about AI in product development:

**For My Capstone**: I now know that AI can accelerate development of complex features, allowing me to tackle more ambitious projects in limited time. But I also know I need to budget time for verification and testing—AI doesn't eliminate QA.

**For Future Ventures**: The hybrid approach (deterministic + AI) will be my default. Pure AI startups feel risky; pure traditional startups feel slow. The sweet spot is using AI strategically for specific high-value, low-risk tasks.

**For Team Collaboration**: If I hire developers, I'll encourage AI tool use but require code reviews and understanding. The goal is leveraging AI for productivity while maintaining code quality and team knowledge.

**The Biggest Surprise**: AI wasn't most valuable for complex tasks—it was most valuable for tedious tasks. Writing API boilerplate, generating TypeScript types, formatting documentation. This freed my mental energy for the hard problems: architecture, UX, and business logic.

The challenge isn't technical anymore—it's judgment. Knowing what to build, how to balance tradeoffs, when to trust AI, and when to override it. These remain fundamentally human skills, and this project reinforced their importance in an AI-augmented world.

---

*Final word count: ~2,850 words*
