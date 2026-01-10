import { model } from '../utils/model';
import { BaseMessage } from '@langchain/core/messages';
import {
    getKeywordAnalysisPrompt,
    getSummaryPrompt,
    getFeedbackPrompt,
    getTodoExtractionPrompt,
} from './prompts';

// Helper function
function cleanJSONResponse(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.replace(/```json\s?|```/g, '').trim();
    // In case there's any other text before/after the JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');

    if (jsonStart !== -1 && jsonEnd !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    } else if (arrayStart !== -1 && arrayEnd !== -1) {
        cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }

    return cleaned;
}

export async function analyzeKeyWords(messages: BaseMessage[]): Promise<Array<string>> {
    // Build conversation history
    const conversationText = messages
        .map((msg) => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = getKeywordAnalysisPrompt(conversationText).trim();

    try {
        const response = await model.invoke(prompt);
        const cleaned = cleanJSONResponse(response.content as string);
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed.keywords)) {
            return parsed.keywords;
        }

        return [];
    } catch (error) {
        console.error('Keyword extraction failed:', error);
        return [];
    }
}

export async function generateSummary(messages: BaseMessage[]): Promise<{ title: string; summary: string }> {
    const history = messages
        .map((msg) => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = getSummaryPrompt(history).trim();

    try {
        const response = await model.invoke(prompt);
        const cleaned = cleanJSONResponse(response.content as string);

        try {
            const parsed = JSON.parse(cleaned);
            return {
                title: parsed.title || 'Reflection',
                summary: parsed.summary || 'No summary available'
            };
        } catch (parseError) {
            console.warn('Failed to parse summary JSON, falling back to raw text:', parseError);
            // Fallback: Use the first sentence or first few words as title, and the rest as summary
            // Or just use a generic title and the full text as summary
            return {
                title: 'Reflection Summary',
                summary: (response.content as string).replace(/```json|```/g, '').trim()
            };
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        return { title: 'Reflection', summary: 'Summary unavailable' };
    }
}

export async function generateFeedback(
    content: string,
    type: 'morning' | 'evening',
    messages: BaseMessage[] = [],
    userName: string,
): Promise<string> {
    const reflectionType = type === 'morning' ? 'Morning Intention' : 'Evening Reflection';

    // 1. Identify the 'Original Context' (First human message in the conversation)
    const originalContextMsg = messages.find(m => m.type === 'human');
    const originalContext = originalContextMsg ? originalContextMsg.content as string : content;

    // 2. Identify 'Current Message' (The 'content' param is typically the latest user message)
    // However, if 'messages' contains recent history, we should ensure we aren't duplicating.
    // The 'content' arg passed here is often state.currentReflection.content, which might be the *initial* text.
    // BUT the prompt expects 'content' to be the LATEST thing said.
    // Let's rely on 'content' being the latest message text to likely remain compatible with the caller.
    // BUT we must ensure the Prompt sees the specific LATEST inputs.

    // Format message history (excluding the current content if it's in there, to avoid duplication in history block)
    const history = messages
        .filter((msg) => msg.content !== content)
        .map((msg) => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = getFeedbackPrompt(history, content, reflectionType, originalContext, userName);

    try {
        const response = await model.invoke(prompt);
        return response.content as string;
    } catch (error) {
        console.error('Error generating feedback:', error);
        return "I'm having trouble processing that right now. Could you try rephrasing?";
    }
}

export async function extractTodos(messages: BaseMessage[]): Promise<string[]> {
    // Build conversation history
    const conversationText = messages
        .map((msg) => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = getTodoExtractionPrompt(conversationText).trim();

    try {
        const response = await model.invoke(prompt);
        const cleaned = cleanJSONResponse(response.content as string);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch (error) {
        console.error('Error generating todos:', error);
        return [];
    }
}
