import { StateGraph, START, END } from '@langchain/langgraph';
import { SearchTool } from './utils/searchTool';
import { StateAnnotation } from './utils/state';
import {
  reflectionProcessor,
  keywordAnalyzer,
  summaryGenerator,
  feedbackGenerator,
  completionProcessor,
  decisionRouter
} from './utils/nodes';




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
    .addConditionalEdges('reflectionProcessor', decisionRouter)
    .addConditionalEdges('keywordAnalyzer', decisionRouter)
    .addConditionalEdges('summaryGenerator', decisionRouter)
    .addConditionalEdges('feedbackGenerator', decisionRouter)
    .addConditionalEdges('completionProcessor', decisionRouter)
    .addConditionalEdges('webSearch', decisionRouter);

  return graph.compile();
};

// Export the compiled graph for use
export const compiledAgent = agent();
