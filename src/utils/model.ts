import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Initialize the AI model once and export it for reuse.
// This uses the Gemini model through LangChain.
// Ensure GOOGLE_API_KEY is set in your environment.
export const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",

    temperature: 0

});
