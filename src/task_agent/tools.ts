
import { SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { model } from '../utils/model';
import { taskStore } from '../storage/task_store';
import { ParsedTask, generateMissingFieldQuestions } from './types';
import { TaskExtractionSchema, TodoDataSchema, EventDataSchema, HabitDataSchema, ReminderDataSchema } from './zod_schemas';
import { buildSystemPrompt } from './prompts';
import { Task } from '../types/task';

// --- Helper Functions (formerly static methods) ---

export async function extractTaskDetails(
    messages: any[],
    currentPartialTask: any,
    lastCreatedTask?: Task
): Promise<ParsedTask> {
    try {
        const now = new Date();
        const currentTimeStr = `${now.toString()} (ISO: ${now.toISOString()})`;
        const systemPrompt = buildSystemPrompt(currentTimeStr);

        let userContext = `
    Current partial task state:
    ${JSON.stringify(currentPartialTask, null, 2)}`;

        if (lastCreatedTask) {
            userContext += `
    
    Recently Created Task (for context):
    ${JSON.stringify({ title: lastCreatedTask.title, type: lastCreatedTask.type, id: lastCreatedTask.id }, null, 2)}
    (If user says "remind me", they might mean THIS task. If so, set isUpdate: true)`;
        }

        userContext += `\n\n    Extract or update task details from the conversation.`;

        // Use structured output!
        const structuredModel = model.withStructuredOutput(TaskExtractionSchema);

        const response = await structuredModel.invoke([
            new SystemMessage({ content: systemPrompt + '\n\n' + userContext }),
            ...messages,
        ]);

        // Structured output response is already the object!
        return response as ParsedTask;

    } catch (e) {
        console.error('Error parsing task:', e);
        throw e;
    }
}

export function generateClarificationContent(
    missingFields: any[],
    validationErrors?: string[],
    acknowledgement?: string,
): string {
    // cast missingFields mainly because Zod inference might make it optional/undefined in ParsedTask 
    // but here we expect an array if we are calling this function. 
    // Actually types say it can be undefined.
    const safeMissingFields = missingFields || [];
    const missingQuestions = generateMissingFieldQuestions(safeMissingFields);
    const opening = acknowledgement || "I'd love to help you set this up!";

    // If we have both validation errors and missing fields
    if (validationErrors && validationErrors.length > 0 && safeMissingFields.length > 0) {
        return `${opening} To get started, could you let me know:\n\n${missingQuestions}`;
    }

    // If we only have validation errors
    if (validationErrors && validationErrors.length > 0) {
        const friendlyErrors = validationErrors
            .map((err) => err.replace('Missing required field: ', ''))
            .join(', ');
        return `${opening}\n\nI'm having a little trouble with some details (${friendlyErrors}). Could you help me fill those in?`;
    }

    // If we only have missing fields
    if (safeMissingFields.length === 1) {
        return `${opening}\n\nJust one quick thing: ${safeMissingFields[0].suggestedQuestion || `What is the ${safeMissingFields[0].field}?`}`;
    }

    return `${opening}\n\nI just need a couple more details:\n\n${missingQuestions}`;
}

export async function generateConfirmationPrompt(task: any): Promise<string> {
    const now = new Date();
    const currentTimeStr = `${now.toString()} (ISO: ${now.toISOString()})`;
    const prompt = `
    I want you to act as a helpful friend confirming plans, not a formal AI assistant.
    
    Context: The current time is ${currentTimeStr}.

    Task details to confirm:
    - **Title:** ${task.title}
    - **Summary:** ${task.summary}
    - **Details:** ${JSON.stringify(task.data, null, 2)}

    Requirements:
    1. Use the user's local timezone (based on current time above) - never show UTC
    2. Write like you're texting a friend - casual but clear
    3. Avoid phrases like "I'm happy to help" or "I'd be delighted" - just get to the point naturally
    4. Don't over-structure with bullet points unless there are many items
    5. Keep it brief and conversational


    Write a quick, natural confirmation that sounds like something a real person would say.
    `;

    const response = await model.invoke([new SystemMessage({ content: prompt }) as any]);
    return response.content as string;
}

// --- Tools ---

/**
 * Tool for creating a task in the database.
 */
export const createTaskTool = tool(
    async ({ userId, title, summary, type, data, remindViaEmail }) => {
        try {
            const task = await taskStore.createTask({
                userId,
                title,
                summary: summary || '',
                type: type as any,
                data: data || {},
                remindViaEmail: remindViaEmail,
                status: 'pending',
            } as any);

            return JSON.stringify(task);
        } catch (error) {
            console.error("Error creating task:", error);
            return "Error creating task";
        }
    },
    {
        name: "create_task",
        description: "Creates a new task (todo, event, habit, reminder) in the database.",
        schema: z.object({
            userId: z.string().describe("The user ID"),
            title: z.string().describe("The title of the task"),
            summary: z.string().optional().describe("A summary of the task"),
            type: z.enum(['todo', 'event', 'habit', 'reminder']).describe("The type of task"),
            data: z.record(z.string(), z.any()).optional().describe("Task specific data"),
            remindViaEmail: z.boolean().optional().describe("Whether to send an email reminder"),
        })
    }
);

export const TaskTools = {
    extractTaskDetails,
    generateClarificationContent,
    generateConfirmationPrompt,
    createTaskTool
};
