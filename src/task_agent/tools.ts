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
                new SystemMessage({ content: systemPrompt }),
                new SystemMessage({ content: userContext }),
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
        const errorText = validationErrors ? `Issues: ${validationErrors.join('\n')}\n` : '';

        return `
    I need a bit more info to create this task:
    
    ${errorText}
    ${missingQuestions}
    `;
    }

    static async generateConfirmationPrompt(task: any): Promise<string> {
        const prompt = `
    All details are collected. Present the task summary to the user for confirmation.
    
    Title: ${task.title}
    Summary: ${task.summary}
    Details: ${JSON.stringify(task.data, null, 2)}
    
    Ask: "Does this look correct?" (Present the details nicely in the message)
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
