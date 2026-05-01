import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const SEO_PROMPTS = {
  MASTER_GENERATOR: `🔥 CORE SYSTEM PROMPT
You are an advanced AI SEO + AEO optimization engine designed to create high-ranking content.
You do NOT write generic content.
You create content that OUTRANKS competitors on Google.

---
INPUT:
- Target Keyword: {{keyword}}
- Competitor Context (RAG Data): {{context}}

---
OBJECTIVES:
1. Analyze competitor content deeply
2. Identify:
   - Missing topics
   - Weak explanations
   - Poor structure
3. Improve ALL of them

---
CONTENT REQUIREMENTS:
Generate a complete, high-quality article with:
1. SEO Title (click-optimized, under 60 characters)
2. Meta Description (CTR-focused, under 160 characters)
3. Introduction (engaging + keyword optimized)
4. Structured Body:
   - H1 (main keyword)
   - H2, H3 (semantic keywords)
5. Add missing sections competitors don’t cover
6. Add real value (examples, insights, clarity)
7. Include internal linking suggestions
8. Include external authority references (if needed)

---
AEO (Answer Engine Optimization):
Add a dedicated FAQ section:
- Minimum 5 questions
- Answer clearly (featured snippet style)
- Use simple, direct language

---
SEO OPTIMIZATION RULES:
- Use keyword naturally (avoid stuffing)
- Include LSI/semantic keywords
- Optimize for readability (short paragraphs)
- Use bullet points where needed
- Ensure mobile-friendly formatting

---
CONTENT QUALITY RULES:
- Human-like tone (not robotic)
- Clear, engaging, and helpful
- Avoid fluff
- Avoid repetition
- Be better than competitors in depth and clarity

---
OUTPUT FORMAT:
Return ONLY the structured markdown.
TITLE:...
META DESCRIPTION:...
CONTENT:
(Full article structured with headings)

FAQ:
Q1:...
A1:...

INTERNAL LINKING IDEAS:
- ...

SEO SCORE (estimate 1–100):...`,

  GAP_ANALYSIS: `🧠 GAP ANALYSIS PROMPT
You are an SEO strategist.
Analyze the following competitor content:
{{context}}

Find:
1. Topics they covered
2. Topics they missed
3. Weak explanations
4. Missing FAQs
5. Structural issues

Return in Markdown:
- List of missing topics
- Improvement plan
- Content structure recommendation`,

  AUTO_IMPROVEMENT: `You are an Elite SEO & User Experience Strategist.
The following content is underperforming based on current search metrics. Your goal is to re-engineer it for maximum engagement and ranking potential.

---
METRICS:
- Position: {{position}}
- CTR: {{ctr}}
- Impressions: {{impressions}}

---
EXISTING CONTENT:
{{content}}

---
INSTRUCTIONS:
1. TITLE REFINEMENT: Create a high-CTR headline that maintains search intent but encourages clicks.
2. STRUCTURAL OVERHAUL:
   - Use a clear hierarchy (H1, H2, H3).
   - Convert dense paragraphs into skimmable, high-value sections.
   - Use bullet points or numbered lists where appropriate.
3. SEMANTIC SEO: Infuse the content with semantic keyword depth (LSI) without keyword stuffing.
4. AEO (ANSWER ENGINE OPTIMIZATION): Add an FAQ section with 3-5 high-impact questions and structured answers designed for Google's featured snippets.
5. FINAL SEO SCORE (0-100): Evaluate the improved version and provide a score at the very end.

Return the improved version in professional Markdown.`,

  KEYWORD_GENERATOR: `🔹 Keyword Generator
Generate 20 high-ranking SEO keywords for: {{topic}}
Include:
- Short keywords
- Long-tail keywords
- Question-based keywords
Return as a clean list.`,

  META_GENERATOR: `🔹 Meta Generator
Write 5 SEO-optimized meta titles and descriptions for: {{topic}}
Focus on high CTR and keyword usage.
Return as Markdown blocks.`,

  FAQ_GENERATOR: `🔹 FAQ Generator
Generate 10 SEO-friendly FAQs for: {{topic}}
Answers should be clear, short, and optimized for featured snippets.
Return in Q&A format.`,

  CONTENT_IMPROVER: `🔹 Content Improver
Improve the following content for SEO and readability:
{{content}}
Make it clearer, more structured, and more engaging.
Return improved Markdown.`,

  SITE_AUDIT: `🔍 WEBSITE SEO & AEO AUDIT
You are an expert SEO Auditor. 
Analyze the following website/URL based on Google's Quality Guidelines (E-E-A-T):
URL/Website: {{url}}

Analyze:
1. Content Quality & Depth
2. AEO Readiness (Structured data, FAQ potential)
3. On-Page Basics (Title, Headers, Meta)
4. Authority Signals (Backlinks, Mentions) - Use Search Grounding to find this info.
5. Technical Performance Estimates (Speed, Mobile-friendliness) - Use Search Grounding for known stats or similar data.

Return a comprehensive Report in Markdown with actionable fixes.`,

  COMPETITOR_RESEARCH: `📊 COMPETITIVE MARKET INTELLIGENCE
Find and analyze the top competitors for: {{domain_or_topic}}

Your Task:
1. Identify the top 5 direct organic search competitors.
2. Compare their Site Authority and common ranking keywords.
3. Identify "Winning Strategies" they are using.
4. Suggest a "Rank-Breaking" plan to outcompete them.

Use Google Search Grounding for real-time accurate competitive data.`
};

export type SEOAction = 
  | 'GENERATE_FULL' 
  | 'GAP_ANALYSIS' 
  | 'AUTO_IMPROVE' 
  | 'KEYWORDS' 
  | 'META' 
  | 'FAQ' 
  | 'IMPROVE'
  | 'SITE_AUDIT'
  | 'COMPETITOR_RESEARCH'
  | 'HISTORY'
  | 'SETTINGS';

interface GenerationParams {
  keyword?: string;
  context?: string;
  content?: string;
  topic?: string;
  position?: string;
  ctr?: string;
  impressions?: string;
  url?: string;
  domain_or_topic?: string;
}

export async function generateSEOContent(action: SEOAction, params: GenerationParams) {
  let prompt = "";
  let useSearch = false;

  switch (action) {
    case 'GENERATE_FULL':
      prompt = SEO_PROMPTS.MASTER_GENERATOR
        .replace("{{keyword}}", params.keyword || "")
        .replace("{{context}}", params.context || "No competitor context provided.");
      break;
    case 'GAP_ANALYSIS':
      prompt = SEO_PROMPTS.GAP_ANALYSIS
        .replace("{{context}}", params.context || "");
      break;
    case 'AUTO_IMPROVE':
      prompt = SEO_PROMPTS.AUTO_IMPROVEMENT
        .replace("{{content}}", params.content || "")
        .replace("{{position}}", params.position || "N/A")
        .replace("{{ctr}}", params.ctr || "N/A")
        .replace("{{impressions}}", params.impressions || "N/A");
      break;
    case 'KEYWORDS':
      prompt = SEO_PROMPTS.KEYWORD_GENERATOR.replace("{{topic}}", params.topic || "");
      break;
    case 'META':
      prompt = SEO_PROMPTS.META_GENERATOR.replace("{{topic}}", params.topic || "");
      break;
    case 'FAQ':
      prompt = SEO_PROMPTS.FAQ_GENERATOR.replace("{{topic}}", params.topic || "");
      break;
    case 'IMPROVE':
      prompt = SEO_PROMPTS.CONTENT_IMPROVER.replace("{{content}}", params.content || "");
      break;
    case 'SITE_AUDIT':
      if (!params.url) throw new Error("Please provide a valid URL for the site audit.");
      prompt = SEO_PROMPTS.SITE_AUDIT.replace("{{url}}", params.url);
      useSearch = true;
      break;
    case 'COMPETITOR_RESEARCH':
      if (!params.domain_or_topic) throw new Error("Please provide a domain or topic for competitor research.");
      prompt = SEO_PROMPTS.COMPETITOR_RESEARCH.replace("{{domain_or_topic}}", params.domain_or_topic);
      useSearch = true;
      break;
  }

  try {
    const request: any = {
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    if (useSearch) {
      request.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent(request);

    if (!response || !response.text) {
      throw new Error("Empty response received from AI engine.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Error Context:", error);
    if (error?.message?.includes("INTERNAL")) {
      throw new Error("AI engine encountered a temporary internal error. This often happens with high-precision search grounding. Please try again in a few moments.", { cause: error });
    }
    throw new Error(error?.message || "Failed to generate SEO content.", { cause: error });
  }
}
