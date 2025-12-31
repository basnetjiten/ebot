import { MoodAnalysis, Todo, Goal } from '../types';
import { model } from './model';

// Mock implementation - in production, these would use actual AI models
export class ReflectionAnalyzer {
  static analyzeMood(content: string): MoodAnalysis {
    // Simple keyword-based mood analysis (replace with actual AI model)
    const positiveWords = ['happy', 'excited', 'grateful', 'optimistic', 'energetic', 'motivated'];
    const negativeWords = ['sad', 'frustrated', 'anxious', 'tired', 'worried', 'disappointed'];
    const emotionWords = ['joyful', 'calm', 'stressed', 'confident', 'hopeful', 'angry'];

    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    const emotions = words.filter(w => emotionWords.includes(w));

    const score = (positiveCount - negativeCount) / Math.max(words.length, 1);
    const intensity = Math.min(1, emotions.length / 5);

    return {
      score: Math.max(-1, Math.min(1, score)),
      emotions: emotions.length > 0 ? emotions : ['neutral'],
      intensity,
      confidence: 0.7 // Mock confidence
    };
  }

  static generateSummary(content: string): string {
    return content;
  }
  static async generateFeedback(
    content: string,
    mood: MoodAnalysis,
    goals: Goal[],
    type: 'morning' | 'evening',
    messageHistory: Array<{ sender: string, content: string }> = []
  ): Promise<string> {
    const reflectionType = type === 'morning' ? 'Morning Intention' : 'Evening Reflection';

    // Format message history
    const history = messageHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are a warm, practical, conversational assistant — like a trusted colleague who also cares. You are not restricted to reflection-only responses.

## Instructions:
- Keep responses brief and to the point
- Use bullet points for multiple suggestions
- Limit to 2-3 key points max
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




  static async extractTodos(content: string): Promise<string> {
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
      return response.content as string;
    } catch (error) {
      console.error('Error generating todos:', error);
      return '[]';
    }
  }



  static analyzeGoalAlignment(content: string, goals: Goal[]): { aligned: boolean; suggestions: string[] } {
    const suggestions: string[] = [];
    let aligned = false;

    if (goals.length === 0) {
      suggestions.push("Consider setting some clear goals to guide your reflections.");
      return { aligned, suggestions };
    }

    // Simple keyword matching for goal alignment
    const contentLower = content.toLowerCase();
    for (const goal of goals) {
      const goalWords = goal.title.toLowerCase().split(/\s+/);
      const matches = goalWords.filter(word => contentLower.includes(word)).length;

      if (matches >= 2) {
        aligned = true;
        suggestions.push(`Your reflection aligns well with your goal: "${goal.title}"`);
      }
    }

    if (!aligned) {
      suggestions.push("Try to connect your daily reflections with your long-term goals.");
    }

    return { aligned, suggestions };
  }
}

// Tool definitions for LangGraph
export const availableTools = [
  {
    name: 'analyze_mood',
    description: 'Analyzes the mood and emotional state from reflection text',
    func: (content: string) => ReflectionAnalyzer.analyzeMood(content),
  },
  {
    name: 'generate_summary',
    description: 'Creates a concise summary of reflection content',
    func: (content: string) => ReflectionAnalyzer.generateSummary(content),
  },
  {
    name: 'generate_feedback',
    description: 'Generates personalized feedback based on reflection and mood',
    func: async (content: string, mood: MoodAnalysis, goals: Goal[], type: 'morning' | 'evening') =>
      await ReflectionAnalyzer.generateFeedback(content, mood, goals, type),
  },
  {
    name: 'extract_todos',
    description: 'Extracts actionable items from reflection text',
    func: (content: string) => ReflectionAnalyzer.extractTodos(content),
  },
  {
    name: 'analyze_goal_alignment',
    description: 'Analyzes how well reflection aligns with user goals',
    func: (content: string, goals: Goal[]) =>
      ReflectionAnalyzer.analyzeGoalAlignment(content, goals),
  },
];


