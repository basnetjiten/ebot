import { StateGraph, START, END } from '@langchain/langgraph';
import { EmailAgentState } from './state';
import { fetchEmailsNode, respondNode } from './nodes';

const workflow = new StateGraph(EmailAgentState)
    .addNode('fetch', fetchEmailsNode)
    .addNode('respond', respondNode)
    .addEdge(START, 'fetch')
    .addEdge('fetch', 'respond')
    .addEdge('respond', END);

export const emailAgent = workflow.compile();
export { EmailAgentState };
