import { StateGraph, START, END } from '@langchain/langgraph';
import { SearchTool } from './utils/searchTool';
import { StateAnnotation } from './utils/state';
import {
  reflectionProcessor,
  moodAnalyzer,
  summaryGenerator,
  goalAlignmentAnalyzer,
  feedbackGenerator,
  completionProcessor,
  reflectionRouter
} from './utils/nodes';

//

export const stateRoutes: Record<string, | 'reflectionProcessor' | 'moodAnalyzer' | 'summaryGenerator' | 'goalAlignmentAnalyzer' | 'feedbackGenerator' | 'completionProcessor' | 'webSearch' | typeof END> = {
  reflectionProcessor: 'reflectionProcessor',
  moodAnalyzer: 'moodAnalyzer',
  summaryGenerator: 'summaryGenerator',
  goalAlignmentAnalyzer: 'goalAlignmentAnalyzer',
  feedbackGenerator: 'feedbackGenerator',
  completionProcessor: 'completionProcessor',
  webSearch: 'webSearch',
  end: END,
  __end__: END,
};


// Create the reflection analysis graph
export const agent = () => {
  const graph = new StateGraph(StateAnnotation)
    .addNode('reflectionProcessor', reflectionProcessor)
    .addNode('moodAnalyzer', moodAnalyzer)
    .addNode('summaryGenerator', summaryGenerator)
    .addNode('goalAlignmentAnalyzer', goalAlignmentAnalyzer)
    .addNode('feedbackGenerator', feedbackGenerator)
    .addNode('completionProcessor', completionProcessor)
    .addNode('webSearch', async (state) => {
      const query = state.query || state.currentReflection?.content || '';
      const results = await SearchTool.search(query);
      return {
        searchResults: results,
        needsWebSearch: false,
        currentStep: 'completion',
      };
    })
    .addEdge(START, 'reflectionProcessor')
    .addConditionalEdges('reflectionProcessor', reflectionRouter, stateRoutes)
    .addConditionalEdges('moodAnalyzer', reflectionRouter, stateRoutes)
    .addConditionalEdges('summaryGenerator', reflectionRouter, stateRoutes)
    .addConditionalEdges('goalAlignmentAnalyzer', reflectionRouter, stateRoutes)
    .addConditionalEdges('feedbackGenerator', reflectionRouter, stateRoutes)
    .addConditionalEdges('completionProcessor', reflectionRouter, stateRoutes)
    .addConditionalEdges('webSearch', reflectionRouter, stateRoutes);

  return graph.compile();
};

// Export the compiled graph for use
export const compiledAgent = agent();
