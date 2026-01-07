import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config';

// Initialize the AI model once and export it for reuse.
// This uses the Gemini model through LangChain.
export const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-lite',
    apiKey: config.google.apiKey,
    temperature: 0.6,
});
