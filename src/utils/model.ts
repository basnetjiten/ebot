import { ChatOllama } from '@langchain/ollama';
import { config } from '../config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// Initialize the AI model once and export it for reuse.
// This uses the Ollama model through LangChain.
export const model = new ChatOllama({
    model: config.ollama.model,
    baseUrl: config.ollama.baseUrl,
    temperature: 0.6,
});

export const googleModel = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: config.google.apiKey,
});
