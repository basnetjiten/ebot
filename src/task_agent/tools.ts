import { SystemMessage, AIMessage } from '@langchain/core/messages';
import { model } from '../utils/model';
import { taskStore } from '../storage/task_store';
import { validateTaskData } from './schemas';
import { ParsedTask, generateMissingFieldQuestions } from './types';
import { buildSystemPrompt } from './prompts';
import { cleanJsonOutput } from './utils';
import { Task } from '../types/task';
import { EmailService } from '../utils/email';
import { database } from '../storage/database';

export class TaskTools {
    static async extractTaskDetails(messages: any[], currentPartialTask: any): Promise<ParsedTask> {
        try {
            const now = new Date();
            const currentTimeStr = `${now.toString()} (ISO: ${now.toISOString()})`;
            const systemPrompt = buildSystemPrompt(currentTimeStr);
            const userContext = `
    Current partial task state:
    ${JSON.stringify(currentPartialTask, null, 2)}

    Extract or update task details from the conversation.`;

            const response = await model.invoke([
                new SystemMessage({ content: systemPrompt + '\n\n' + userContext }),
                ...messages,
            ]);

            const cleaned = cleanJsonOutput(response.content as string);
            const extracted: ParsedTask = JSON.parse(cleaned);

            // Validate extracted data
            const validationErrors = validateTaskData(extracted.type, extracted.data);
            if (validationErrors.length > 0) {
                extracted.validationErrors = validationErrors;
            }

            return extracted;
        } catch (e) {
            console.error('Error parsing task:', e);
            throw e;
        }
    }

    static generateClarificationContent(
        missingFields: any[],
        validationErrors?: string[],
        acknowledgement?: string,
    ): string {
        const missingQuestions = generateMissingFieldQuestions(missingFields);
        const opening = acknowledgement || "I'd love to help you set this up!";

        // If we have both validation errors and missing fields
        if (validationErrors && validationErrors.length > 0 && missingFields.length > 0) {
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
        if (missingFields.length === 1) {
            return `${opening}\n\nJust one quick thing: ${missingQuestions}`;
        }

        return `${opening}\n\nI just need a couple more details:\n\n${missingQuestions}`;
    }

    static async generateConfirmationPrompt(task: any): Promise<string> {
        const now = new Date();
        const currentTimeStr = `${now.toString()} (ISO: ${now.toISOString()})`;
        const prompt = `
     You're confirming task details with someone in a friendly way.
     The current time is ${currentTimeStr}.

     IMPORTANT: When displaying times to the user, ALWAYS use their LOCAL time (based on the current time provided above).
     Do NOT show UTC times if they differ from the user's local context.

     Task details:
     Title: ${task.title}
     Summary: ${task.summary}
Details: ${JSON.stringify(task.data, null, 2)}

Create a short, friendly message that:
- Shows them what you're about to create
- Presents the key details in a readable way (not raw JSON)
- Simply asks if they want to create this task

Keep it brief and natural. Example format:

"Alright! I'm ready to create:

**${task.title}**
${task.summary}

[Show key details nicely]

Create this task?"
`;

        const response = await model.invoke([new SystemMessage({ content: prompt }) as any]);
        return response.content as string;
    }

    static async createTask(userId: string, partialTask: any): Promise<Task> {
        const task = await taskStore.createTask({
            userId: userId,
            title: partialTask.title!,
            summary: partialTask.summary || '',
            type: partialTask.type as any,
            data: partialTask.data || {},
            remindViaEmail: partialTask.remindViaEmail ?? partialTask.data?.remindViaEmail,
            status: 'pending',
        } as any);



        return task;
    }
}
