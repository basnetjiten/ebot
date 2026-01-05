import { AgentStateType } from './state';
import { ReflectionAnalyzer } from './tools';
import { START, END } from '@langchain/langgraph';
import { Todo } from '../types';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

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
    const todos = await ReflectionAnalyzer.extractTodos(content);

    const suggestedTodos: Todo[] = todos.map(todo => ({
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
      suggestedTodos: suggestedTodos,
      messages: [new HumanMessage(content)],
      currentStep: 'keyword_analysis'
    };
  } catch (error) {
    return {
      error: `Failed to process reflection: ${error}`,
      currentStep: 'error'
    };
  }
};

// Node for mood analysis
export const keywordAnalyzer = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
  console.log('Analyzing keywords for reflection:', state.currentReflection?.id);

  if (!state.currentReflection?.content) {
    return {
      error: 'No reflection content available for keyword analysis',
      currentStep: 'error'
    };
  }

  try {
    const keywordAnalysis = await ReflectionAnalyzer.analyzeKeyWords(state.currentReflection.content);

    return {
      keywordAnalysis,
      currentStep: 'summary_generation'
    };
  } catch (error) {
    return {
      error: `Failed to analyze keywords: ${error}`,
      currentStep: 'error'
    };
  }
};



// Node for generating summary
export const summaryGenerator = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
  console.log('Generating summary for reflection:', state.currentReflection?.id);

  if (!state.currentReflection?.content) {
    return {
      error: 'No reflection content available for summary',
      currentStep: 'error'
    };
  }

  try {
    const summary = await ReflectionAnalyzer.generateSummary(state.messages);

    return {
      summary,
      currentStep: 'feedback_generation'
    };
  } catch (error) {
    return {
      error: `Failed to generate summary: ${error}`,
      currentStep: 'error'
    };
  }
};



// Node for generating feedback
export const feedbackGenerator = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
  console.log('Generating feedback for reflection:', state.currentReflection?.id);

  if (!state.currentReflection?.content) {
    return {
      error: 'Missing reflection content or keyword analysis for feedback generation',
      currentStep: 'error'
    };
  }

  try {
    const feedback = await ReflectionAnalyzer.generateFeedback(
      state.currentReflection.content,
      state.currentReflection.type,
      state.messages
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
    keywords: state.keywordAnalysis,
    summary: state.summary,
    feedback: state.feedback
  } : null;

  return {
    currentReflection: updatedReflection,
    messages: [new AIMessage(state.feedback)],
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
    return END;
  }

  switch (state.currentStep) {
    case 'initial':
      return 'reflectionProcessor';
    case 'keyword_analysis':
      return 'keywordAnalyzer';
    case 'summary_generation':
      return 'summaryGenerator';
    case 'feedback_generation':
      return 'feedbackGenerator';
    case 'completion':
      return 'completionProcessor';
    case 'completed':
      return END;
    case 'error':
      return END;
    default:
      return 'reflectionProcessor';
  }
};


