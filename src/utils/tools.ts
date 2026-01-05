import { Todo } from '../types';
import { model } from './model';
import { BaseMessage } from '@langchain/core/messages';

// Mock implementation - in production, these would use actual AI models
export class ReflectionAnalyzer {
  private static cleanJSONResponse(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.replace(/```json\s?|```/g, '').trim();
    // In case there's any other text before/after the JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');

    if (jsonStart !== -1 && jsonEnd !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    } else if (arrayStart !== -1 && arrayEnd !== -1) {
      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }

    return cleaned;
  }

  static async analyzeKeyWords(content: string): Promise<Array<string>> {
    const prompt = `
You are a keyword extraction assistant.

Extract meaningful keywords from the user's text.

Rules:
- Focus on topics, actions, and concepts
- Ignore emotions and filler words
- Prefer nouns and verb phrases
- Return 2-3 keywords
- No explanations

Return ONLY valid JSON in this format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

User text:
"""${content}"""
`.trim();

    try {
      const response = await model.invoke(prompt);
      const cleaned = this.cleanJSONResponse(response.content as string);
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed.keywords)) {
        return parsed.keywords;
      }

      return [];
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return [];
    }
  }


  static async generateSummary(messages: BaseMessage[]): Promise<string> {
    const history = messages
      .map(msg => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `
You are a summary assistant.

Summarize the following conversation into a single concise sentence (max 20 words).
Focus on the main topics and outcomes.

Conversation:
${history}
`.trim();

    try {
      const response = await model.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary unavailable';
    }
  }

  static async generateFeedback(
    content: string,
    type: 'morning' | 'evening',
    messages: BaseMessage[] = []
  ): Promise<string> {
    const reflectionType = type === 'morning' ? 'Morning Intention' : 'Evening Reflection';

    // Format message history
    const history = messages
      .filter(msg => msg.content !== content) // Exclude the current message if it's already in the list
      .map(msg => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are a warm, practical, conversational assistant — like a trusted colleague who also cares. You are not restricted to reflection-only responses.

## Instructions:
- Keep responses brief and to the point
- Use bullet points for multiple suggestions
- Limit to 3-4 key points max
- Be direct and actionable


## Conversation History:
${history || 'No previous messages'}

## Current Message:
User: ${content}

## Context
This conversation may include:
- A morning intention
- An evening reflection
- A follow-up question asking for help or advice

Type: ${reflectionType}

## Critical Conversation Rule (DO NOT IGNORE)
If the user asks for advice, suggestions, or "how to" guidance — even if it follows a morning intention or reflection — you MUST:
- Answer their question directly
- Provide clear, practical guidance
- Stop asking reflective questions
- Do NOT reframe it as an intention
- Do NOT ask how else you can help

## How to Respond
### Case 1 — User is asking for help or advice
- Give actionable, relevant suggestions
- Keep it concise and friendly
- Structure the answer if helpful
- No follow-up questions unless necessary

### Case 2 — User is sharing thoughts or intentions (no question)
- Acknowledge briefly
- Validate emotion in one short phrase
- Ask ONE supportive question

Now respond appropriately to the user's last message.`;

    try {
      const response = await model.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return "I'm having trouble processing that right now. Could you try rephrasing?";
    }
  }




  static async extractTodos(content: string): Promise<string[]> {
    const prompt = `
You are a productivity assistant.

Based on the user's reflection below, extract EXACTLY 3 actionable TODO items.

Rules:
- Each TODO must be a short, clear action (max 12 words).
- Focus on concrete next steps.
- Do NOT include explanations.
- Do NOT include numbering.
- Return the result as a JSON array of strings ONLY.

User reflection:
"""${content}"""

Output format:
["todo one", "todo two", "todo three"]
`.trim();

    try {
      const response = await model.invoke(prompt);
      const cleaned = this.cleanJSONResponse(response.content as string);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Error generating todos:', error);
      return [];
    }
  }

}

// Tool definitions for LangGraph
export const availableTools = [
  {
    name: 'analyze_keywords',
    description: 'Extracts meaningful keywords from reflection text',
    func: (content: string) => ReflectionAnalyzer.analyzeKeyWords(content),
  },
  {
    name: 'generate_summary',
    description: 'Creates a concise summary of reflection content',
    func: (messages: BaseMessage[]) => ReflectionAnalyzer.generateSummary(messages),
  },
  {
    name: 'generate_feedback',
    description: 'Generates personalized feedback based on reflection and keywords',
    func: async (content: string, type: 'morning' | 'evening', messages: BaseMessage[] = []) =>
      await ReflectionAnalyzer.generateFeedback(content, type, messages),
  },
  {
    name: 'extract_todos',
    description: 'Extracts actionable items from reflection text',
    func: (content: string) => ReflectionAnalyzer.extractTodos(content),
  },

];


