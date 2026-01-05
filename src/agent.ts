import { StateGraph, START, END } from '@langchain/langgraph';
import { SearchTool } from './utils/searchTool';
import { StateAnnotation } from './utils/state';
import {
  reflectionProcessor,
  keywordAnalyzer,
  summaryGenerator,
  feedbackGenerator,
  completionProcessor,
  reflectionRouter
} from './utils/nodes';


export const stateRoutes: Record<string, | 'reflectionProcessor' | 'keywordAnalyzer' | 'summaryGenerator' | 'feedbackGenerator' | 'completionProcessor' | 'webSearch' | typeof END> = {
  reflectionProcessor: 'reflectionProcessor',
  keywordAnalyzer: 'keywordAnalyzer',
  summaryGenerator: 'summaryGenerator',
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
    .addNode('keywordAnalyzer', keywordAnalyzer)
    .addNode('summaryGenerator', summaryGenerator)
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
    .addConditionalEdges('keywordAnalyzer', reflectionRouter, stateRoutes)
    .addConditionalEdges('summaryGenerator', reflectionRouter, stateRoutes)
    .addConditionalEdges('feedbackGenerator', reflectionRouter, stateRoutes)
    .addConditionalEdges('completionProcessor', reflectionRouter, stateRoutes)
    .addConditionalEdges('webSearch', reflectionRouter, stateRoutes);

  return graph.compile();
};

// Export the compiled graph for use
export const compiledAgent = agent();
