import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, GroundingChunk, ModelMode, Attachment, Evidence } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: import.meta.env.API_KEY });

const getSystemInstruction = (mode: ModelMode) => {
  const base = `You are a rigorous AI Research Analyst. Your core directive is **EVIDENCE-BASED SYNTHESIS**.\n\n`;
  
  // Fast Mode: Relaxed constraints, allow general knowledge
  if (mode === 'fast') {
     return base + `
**MODE: FAST ANALYSIS**
1. **PDF ANALYSIS**: If PDFs are provided, prioritize analyzing them and cite Page Numbers where possible.
2. **GENERAL KNOWLEDGE**: For general queries without documents, provide helpful, accurate answers based on your internal knowledge.
3. **TONE**: Professional, concise, and direct.
4. **FORMAT**: Use Markdown for headers and lists.
     `;
  }

  // Web & Deep Modes: Strict Sourcing
  return base + `
**CRITICAL RULES:**
1.  **NO UNSOURCED CLAIMS**: Every single claim you make must be backed by a specific source (URL or PDF Page). If you cannot find a source, DO NOT state the claim.
2.  **PDF ANALYSIS**: When analyzing PDFs, you MUST cite the specific Page Number (e.g., "Page 12").
3.  **WEB SEARCH**: Use Google Search to verify facts. Cite the specific URL.

**OUTPUT FORMAT:**
1.  Provide your analytical response in clear Markdown. Use inline citations like [1], [Page 5].
2.  **EVIDENCE GRAPH**: At the very end of your response, you MUST output a JSON block wrapped in \`\`\`json\`\`\`. This block represents the "Evidence Graph".
    *   It must be an array of objects.
    *   Each object must have:
        *   \`claim\`: A concise string of the fact being stated.
        *   \`sourceType\`: "web" or "pdf".
        *   \`sourceName\`: The filename (for PDFs) or Website Title (for Web).
        *   \`sourceReference\`: The full URL (for Web) or "Page X" (for PDFs).

Example JSON Structure:
\`\`\`json
[
  {
    "claim": "The company revenue grew by 20% in Q3.",
    "sourceType": "pdf",
    "sourceName": "Q3_Report.pdf",
    "sourceReference": "Page 14"
  },
  {
    "claim": "Competitor X launched a similar product in 2023.",
    "sourceType": "web",
    "sourceName": "TechNews Daily",
    "sourceReference": "https://technews.example.com/article"
  }
]
\`\`\`

**TONE:**
Professional, objective, high-level executive summary style.
`;
};

export const generateResearchResponse = async (
  currentPrompt: string,
  history: Message[],
  attachments: Attachment[],
  mode: ModelMode
): Promise<{ text: string; groundingChunks: GroundingChunk[]; evidence: Evidence[] }> => {
  
  try {
    // Convert previous chat history
    const historyContents: Content[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Build current user message parts
    const currentParts: Part[] = [];

    // Add attachments (Images/PDFs) with Filename Context
    attachments.forEach((att) => {
      currentParts.push({ text: `[File Context: ${att.name}]` });
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      });
    });

    // Add text prompt
    currentParts.push({ text: currentPrompt });

    // Configuration based on Mode
    let modelName = 'gemini-2.5-flash';
    let tools: any[] | undefined = undefined;

    if (mode === 'deep') {
        modelName = 'gemini-3-pro-preview';
        tools = [{ googleSearch: {} }];
    } else if (mode === 'web') {
        modelName = 'gemini-2.5-flash';
        tools = [{ googleSearch: {} }];
    } else {
        // fast
        modelName = 'gemini-2.5-flash';
        tools = undefined; // No search tools for maximum speed/internal knowledge
    }

    // Call Gemini
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...historyContents,
        { role: "user", parts: currentParts },
      ],
      config: {
        systemInstruction: getSystemInstruction(mode),
        tools: tools,
      },
    });

    let fullText = response.text || "No response generated.";
    let evidence: Evidence[] = [];
    let cleanText = fullText;

    // Parse out the JSON Evidence Graph (Only for Web/Deep modes usually, but check anyway)
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = fullText.match(jsonBlockRegex);

    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
            evidence = parsed;
            // Remove the JSON block from the display text
            cleanText = fullText.replace(match[0], '').trim();
        }
      } catch (e) {
        console.warn("Failed to parse Evidence Graph JSON", e);
      }
    }

    // Extract grounding metadata (native Google Search citations)
    const candidates = response.candidates;
    let groundingChunks: GroundingChunk[] = [];
    
    if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
      groundingChunks = candidates[0].groundingMetadata.groundingChunks as GroundingChunk[];
    }

    return { text: cleanText, groundingChunks, evidence };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
