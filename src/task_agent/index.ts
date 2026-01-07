import { StateGraph, START, END } from '@langchain/langgraph';
import { TaskStateAnnotation } from './state';
import {
    parseRequestNode,
    askClarificationNode,
    confirmTaskNode,
    saveTaskNode,
    routeNode,
} from './nodes';

export const taskAgent = new StateGraph(TaskStateAnnotation)
    .addNode('parseRequest', parseRequestNode)
    .addNode('askClarification', askClarificationNode)
    .addNode('confirmTask', confirmTaskNode)
    .addNode('saveTask', saveTaskNode)
    .addEdge(START, 'parseRequest')
    .addConditionalEdges('parseRequest', routeNode, {
        askClarification: 'askClarification',
        confirmTask: 'confirmTask',
        saveTask: 'saveTask',
        [END]: END,
    })
    .addEdge('askClarification', END)
    .addEdge('confirmTask', 'saveTask')
    .addConditionalEdges('confirmTask', (state) => {
        if (state.isComplete) return 'saveTask';
        return END;
    })
    .addEdge('saveTask', END)
    .compile();
