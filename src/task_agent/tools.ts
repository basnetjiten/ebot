import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { model } from "../utils/model";
import { taskStore } from "../storage/task_store";
import { validateTaskData } from "./schemas";
import { ParsedTask, generateMissingFieldQuestions } from "./types";
import { buildSystemPrompt } from "./prompts";
import { cleanJsonOutput } from "./utils";
import { Task } from "../types/task";

export class TaskTools {

    static async extractTaskDetails(messages: any[], currentPartialTask: any): Promise<ParsedTask> {
        try {
            const systemPrompt = buildSystemPrompt();
            const userContext = `
Current partial task state:
${JSON.stringify(currentPartialTask, null, 2)}

Extract or update task details from the conversation.`;

            const response = await model.invoke([
                new SystemMessage({ content: systemPrompt + "\n\n" + userContext }),
                ...messages
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
            console.error("Error parsing task:", e);
            throw e;
        }
    }

    static generateClarificationContent(missingFields: any[], validationErrors?: string[]): string {
        const missingQuestions = generateMissingFieldQuestions(missingFields);

        // If we have both validation errors and missing fields, it means the extraction didn't work well
        if (validationErrors && validationErrors.length > 0 && missingFields.length > 0) {
            return `I'd love to help you set this up! To get started, could you let me know:\n\n${missingQuestions}`;
        }

        // If we only have validation errors (shouldn't happen often)
        if (validationErrors && validationErrors.length > 0) {
            const friendlyErrors = validationErrors
                .map(err => err.replace('Missing required field: ', ''))
                .join(', ');
            return `I'm having a little trouble with some details (${friendlyErrors}). Could you help me fill those in?`;
        }

        // If we only have missing fields (the normal case)
        if (missingFields.length === 1) {
            return `Just one quick thing: ${missingQuestions}`;
        }

        return `I just need a couple more details:\n\n${missingQuestions}`;
    }

    static async generateConfirmationPrompt(task: any): Promise<string> {
        const prompt = `
You're confirming task details with someone in a friendly way.

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
        return await taskStore.createTask({
            userId: userId,
            title: partialTask.title!,
            summary: partialTask.summary,
            type: partialTask.type as any,
            data: partialTask.data || {},
            status: 'pending'
        } as any);
    }
}
