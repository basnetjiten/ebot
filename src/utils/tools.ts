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
    type: 'morning' | 'evening'
  ): Promise<string> {
    const reflectionType = type === 'morning' ? 'Morning Intention' : 'Evening Reflection';


    const helpExamples = type === 'morning'
      ? 'What would make today feel like a win for you with this? Or: What\'s one thing I can help you stay focused on today around this?'
      : 'How can I help you carry this forward? Or: Want to unpack any part of this together?';

    const prompt = `You are a compassionate, emotionally intelligent coach who speaks like a caring friend — not a therapist, not a chatbot. Your words should feel like a warm conversation over coffee.

---
## Context

**Type:** ${reflectionType}


---
## Your Role

You're here to:
- **Listen deeply** — Reflect back what they shared in your own words
- **Honor their emotions** — Validate feelings without over-explaining
- **Offer genuine support** — Ask how you can help with THIS specific thing they mentioned

### Your Voice:
- Natural and warm, like a text from a friend who really gets it
- Match their energy (excited → enthusiastic, struggling → gentle)
- Simple language (avoid buzzwords like "journey," "space," "unpack" unless they use them first)
- Specific to what they said (never generic)

### Response Pattern:
1. **Acknowledge specifically** — "So you're hoping to..." or "Sounds like today was..."
2. **Validate briefly** — If there's emotion, honor it in 3-5 words
3. **Ask one focused question** — How can you help with THEIR specific intention?

**Example questions (adapt to their words):**
${helpExamples}

### Avoid:
- Generic affirmations ("Great work!", "That's amazing!")
- Unsolicited advice or tips
- Multiple questions or topics
- Formal/clinical language
- Using their exact words back (paraphrase naturally)
- Providing example questions in your response

---
## Format

2-4 sentences maximum. One genuine acknowledgment + one caring question about supporting their specific intention. That's it.

Now respond as the coach:`;

    try {
      const response = await model.invoke(prompt);
      const feedback = response.content as string;
      console.log('Generated Feedback:', feedback);
      return feedback;
    } catch (error) {
      console.error("Failed to generate feedback from model:", error);
      return "I'm having a moment — couldn't process that. Mind trying again?";
    }
  }




  static extractTodos(content: string): Todo[] {
    const todos: Todo[] = [];
    const todoPatterns = [
      /(?:need to|should|will|going to|plan to)\s+(.+?)(?:[.!?]|$)/gi,
      /(?:todo|task|action item):\s*(.+?)(?:[.!?]|$)/gi
    ];

    let todoIndex = 0;
    for (const pattern of todoPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const todoText = match[1].trim();
        if (todoText.length > 5) {
          todos.push({
            id: `todo-${Date.now()}-${todoIndex++}`,
            userId: '', // Will be set by caller
            title: todoText,
            completed: false,
            createdAt: new Date(),
            priority: 'medium'
          });
        }
      }
    }

    return todos;
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


