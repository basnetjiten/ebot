
import { Todo } from '../types';
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

export async function generateSummary(messages: BaseMessage[]): Promise<string> {
    const history = messages
        .map((msg) => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = getSummaryPrompt(history).trim();

    try {
        const response = await model.invoke(prompt);
        return response.content as string;
    } catch (error) {
        console.error('Error generating summary:', error);
        return 'Summary unavailable';
    }
}

export async function generateFeedback(
    content: string,
    type: 'morning' | 'evening',
    messages: BaseMessage[] = [],
): Promise<string> {
    const reflectionType = type === 'morning' ? 'Morning Intention' : 'Evening Reflection';

    // Format message history
    const history = messages
        .filter((msg) => msg.content !== content)
        .map((msg) => `${msg.type === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const prompt = getFeedbackPrompt(history, content, reflectionType);

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
