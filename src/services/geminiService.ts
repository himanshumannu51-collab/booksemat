import { GoogleGenAI } from "@google/genai";
import { KnowledgeUnit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function extractKnowledge(text: string): Promise<Partial<KnowledgeUnit>[]> {
  const prompt = `
    You are a Knowledge Extraction Agent. Your goal is to extract structured knowledge from the following text chunk.
    
    Extract:
    1. Principles: Fundamental truths or rules that are universally applicable within a context.
    2. Frameworks: Structured ways of thinking, models, or step-by-step processes.
    3. Insights: Specific realizations, observations, or "aha" moments.
    
    Return the results as a JSON array of objects with the following structure:
    {
      "title": "Short descriptive title",
      "content": "Detailed explanation of the principle/framework/insight",
      "type": "principle" | "framework" | "insight",
      "tags": ["tag1", "tag2"],
      "confidence": 0.0 to 1.0
    }
    
    Text Chunk:
    "${text}"
    
    Return ONLY the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const textResponse = response.text || "[]";
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Extraction error:", error);
    return [];
  }
}

export async function synthesizeDecision(query: string, context: KnowledgeUnit[]): Promise<string> {
  const contextStr = context.map(unit => `
    Type: ${unit.type}
    Title: ${unit.title}
    Content: ${unit.content}
  `).join("\n---\n");

  const prompt = `
    You are a Strategic Decision Agent. Your goal is to map a user's situation to relevant principles and frameworks to provide actionable advice.
    
    User Query: ${query}
    
    Relevant Knowledge Context:
    ${contextStr}
    
    Strict Rules:
    1. Only use the provided knowledge context.
    2. If the context is insufficient, state "Insufficient data to provide a high-leverage decision."
    3. Synthesize a clear, actionable decision or strategy.
    4. Explain which principles or frameworks were used.
    
    Response format: Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Synthesis error:", error);
    return "Error generating decision synthesis.";
  }
}
