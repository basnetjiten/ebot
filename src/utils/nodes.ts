import { AgentStateType } from './state';
import { ReflectionAnalyzer } from './tools';
import { SearchTool } from './searchTool';
import { ReflectionEntry, MoodAnalysis, Todo } from '../types';

// Node for processing reflection entries
export const reflectionProcessor = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
  console.log('Processing reflection entry for user:', state.userId);

  if (!state.currentReflection?.content) {
    return {
      error: 'No reflection content provided',
      currentStep: 'error'
    };
  }

  const content = state.currentReflection.content;

  try {
    // Extract todos from the reflection
    const todosData = await ReflectionAnalyzer.extractTodos(content);
    const todos = JSON.parse(todosData) as string[];

    const todosWithUserId: Todo[] = todos.map(todo => ({
      id: crypto.randomUUID(),
      userId: state.userId,
      title: todo,
      completed: false,
      createdAt: new Date(),
      description: '',
      priority: 'medium',
      sourceReflectionId: state.currentReflection?.id
    }));

    return {
      suggestedTodos: todosWithUserId,
      currentStep: 'mood_analysis'
    };
  } catch (error) {
    return {
      error: `Failed to process reflection: ${error}`,
      currentStep: 'error'
    };
  }
};

// Node for mood analysis
export const moodAnalyzer = (state: AgentStateType): Partial<AgentStateType> => {
  console.log('Analyzing mood for reflection:', state.currentReflection?.id);

  if (!state.currentReflection?.content) {
    return {
      error: 'No reflection content available for mood analysis',
      currentStep: 'error'
    };
  }

  try {
    const moodAnalysis = ReflectionAnalyzer.analyzeMood(state.currentReflection.content);

    return {
      moodAnalysis,
      currentStep: 'summary_generation'
    };
  } catch (error) {
    return {
      error: `Failed to analyze mood: ${error}`,
      currentStep: 'error'
    };
  }
};

// Node for generating summary
export const summaryGenerator = (state: AgentStateType): Partial<AgentStateType> => {
  console.log('Generating summary for reflection:', state.currentReflection?.id);

  if (!state.currentReflection?.content) {
    return {
      error: 'No reflection content available for summary',
      currentStep: 'error'
    };
  }

  try {
    const summary = ReflectionAnalyzer.generateSummary(state.currentReflection.content);

    return {
      summary,
      currentStep: 'goal_alignment'
    };
  } catch (error) {
    return {
      error: `Failed to generate summary: ${error}`,
      currentStep: 'error'
    };
  }
};

// Node for analyzing goal alignment
export const goalAlignmentAnalyzer = (state: AgentStateType): Partial<AgentStateType> => {
  console.log('Analyzing goal alignment for user:', state.userId);

  if (!state.currentReflection?.content) {
    return {
      error: 'No reflection content available for goal alignment',
      currentStep: 'error'
    };
  }

  try {
    const alignment = ReflectionAnalyzer.analyzeGoalAlignment(
      state.currentReflection.content,
      state.userGoals
    );

    return {
      goalAlignment: alignment,
      currentStep: 'feedback_generation'
    };
  } catch (error) {
    return {
      error: `Failed to analyze goal alignment: ${error}`,
      currentStep: 'error'
    };
  }
};

// Node for generating feedback
export const feedbackGenerator = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
  console.log('Generating feedback for reflection:', state.currentReflection?.id);

  if (!state.currentReflection?.content || !state.moodAnalysis) {
    return {
      error: 'Missing reflection content or mood analysis for feedback generation',
      currentStep: 'error'
    };
  }

  try {
    const feedback = await ReflectionAnalyzer.generateFeedback(
      state.currentReflection.content,
      state.moodAnalysis,
      state.userGoals,
      state.currentReflection.type
    );
    // If the reflection suggests a need for external information, route to the web search node.
    if (feedback.toLowerCase().includes('search for') || feedback.toLowerCase().includes('look up')) {
      return {
        feedback,
        needsWebSearch: true, // Set the flag for web search
        query: state.currentReflection.content, // Use reflection content as the search query
        currentStep: 'web_search' // Route to the web search node
      };
    }

    // Otherwise, proceed to completion.
    return {
      feedback,
      currentStep: 'completion'
    };
  } catch (error) {
    return {
      error: `Failed to generate feedback: ${error}`,
      currentStep: 'error'
    };
  }
};

// Node for completing the analysis
export const completionProcessor = (state: AgentStateType): Partial<AgentStateType> => {
  console.log('Completing reflection analysis for:', state.currentReflection?.id);

  // Update the reflection with analysis results
  const updatedReflection = state.currentReflection ? {
    ...state.currentReflection,
    mood: state.moodAnalysis,
    summary: state.summary,
    feedback: state.feedback
  } : null;

  return {
    currentReflection: updatedReflection,
    analysisComplete: true,
    currentStep: 'completed'
  };
};

// Decision node for routing the reflection analysis workflow
export const reflectionRouter = (state: AgentStateType) => {
  console.log('Routing reflection analysis, current step:', state.currentStep);

  if (state.needsWebSearch) {
    return 'webSearch';
  }

  if (state.error) {
    return '__end__';
  }

  switch (state.currentStep) {
    case 'initial':
      return 'reflectionProcessor';
    case 'mood_analysis':
      return 'moodAnalyzer';
    case 'summary_generation':
      return 'summaryGenerator';
    case 'goal_alignment':
      return 'goalAlignmentAnalyzer';
    case 'feedback_generation':
      return 'feedbackGenerator';
    case 'completion':
      return 'completionProcessor';
    case 'completed':
      return '__end__';
    case 'error':
      return '__end__';
    default:
      return 'reflectionProcessor';
  }
};

// Legacy node exports for backward compatibility
export const messageProcessor = reflectionProcessor;
export const toolExecutor = feedbackGenerator;
export const router = reflectionRouter;
