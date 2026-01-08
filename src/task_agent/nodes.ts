import { AIMessage } from '@langchain/core/messages';
import { END } from '@langchain/langgraph';
import { TaskStateAnnotation } from './state';
import { extractTaskDetails, generateClarificationContent, generateConfirmationPrompt, createTaskTool } from './tools';
import { taskStore } from '../storage/task_store';
import { Task } from '../types/task';

// Node: Parse User Request
export const parseRequestNode = async (state: typeof TaskStateAnnotation.State) => {
    console.log('Parsing request...');

    try {
        // If we are waiting for an email reminder choice, handle it first
        if (state.isWaitingForEmailChoice && state.lastCreatedTaskId) {
            const lowerMsg = state.messages[state.messages.length - 1].content.toLowerCase();
            const isYes = lowerMsg.includes('yes') || lowerMsg.includes('sure') || lowerMsg.includes('ok') || lowerMsg.includes('perfect');

            if (isYes) {
                await taskStore.updateTask(state.lastCreatedTaskId, { remindViaEmail: true } as any);
                return {
                    messages: [new AIMessage("Great! I've turned on email reminders for that task. What else can I help you with?")],
                    isWaitingForEmailChoice: false,
                    lastCreatedTaskId: undefined,
                    partialTask: {},
                    isDone: true, // Signal that we're done with this conversation
                };
            } else {
                return {
                    messages: [new AIMessage("No problem! Is there anything else you'd like to organize today?")],
                    isWaitingForEmailChoice: false,
                    lastCreatedTaskId: undefined,
                    partialTask: {},
                    isDone: true, // Signal that we're done with this conversation
                };
            }
        }

        // Fetch recently created task for context if available
        let lastTask: Task | undefined;
        if (state.lastCreatedTaskId) {
            const tasks = await taskStore.getTasks(state.userId);
            lastTask = tasks.find(t => t.id === state.lastCreatedTaskId);
        }

        const extracted = await extractTaskDetails(state.messages, state.partialTask, lastTask);

        // Handle UPDATE logic
        if (extracted.isUpdate && state.lastCreatedTaskId && lastTask) {
            console.log(`[ParseNode] Detected update intent for task ${state.lastCreatedTaskId}`);

            // Update the task in DB
            await taskStore.updateTask(state.lastCreatedTaskId, {
                // We merge the extracted data into the existing task data
                // But wait, extracted.data might need to be merged carefully?
                // Simple merge for now:
                data: { ...lastTask.data, ...extracted.data } as any,
                // Also update top-level fields if present
                ...(extracted.title ? { title: extracted.title } : {}),
                ...(extracted.type ? { type: extracted.type } : {}),
                remindViaEmail: extracted.data?.remindViaEmail ?? lastTask.remindViaEmail // promoted field
            } as any);

            const updateMsg = "I've updated the task for you!";
            return {
                messages: [new AIMessage(updateMsg)],
                isWaitingForEmailChoice: false,
                // partialTask: {}, // Do not clear partialTask? Actually we should clear it if we are done.
                partialTask: {},
                isDone: true, // End conversation turn
            };
        }

        // Standard Creation Flow (Merge with existing partial task)
        const updatedTask = {
            type: extracted.type || 'todo',
            title: extracted.title || state.partialTask.title,
            summary: extracted.summary || state.partialTask.summary,
            data: {
                ...(state.partialTask.data || {}),
                ...extracted.data,
            },
        };

        // Check for any remaining missing fields
        const missingFieldsData = extracted.missingFields || [];
        const hasCriticalIssues =
            (extracted.validationErrors && extracted.validationErrors.length > 0) ||
            missingFieldsData.length > 0;

        return {
            partialTask: updatedTask,
            missingFields: missingFieldsData,
            isConfirmationPending: !hasCriticalIssues,
            validationErrors: extracted.validationErrors,
            acknowledgement: extracted.conversationalResponse,
        };
    } catch (e) {
        console.error('Error parsing task in node:', e);
        return {
            error: 'Failed to parse task details. Please try rephrasing your request.',
            validationErrors: [e instanceof Error ? e.message : String(e)],
        };
    }
};

// Node: Ask Clarification
export const askClarificationNode = async (state: typeof TaskStateAnnotation.State) => {
    console.log('Asking clarification...');

    const content = generateClarificationContent(
        state.missingFields,
        state.validationErrors,
        state.acknowledgement,
    );

    return {
        messages: [new AIMessage(content)],
        isConfirmationPending: false,
    };
};

// Node: Confirm Task
export const confirmTaskNode = async (state: typeof TaskStateAnnotation.State) => {
    console.log('Confirming task...');

    // Skip confirmation if we're waiting for email choice
    if (state.isWaitingForEmailChoice) {
        return {};
    }

    // Check if user has just said "yes" or "confirmed"
    const lastMessage = state.messages[state.messages.length - 1].content.toLowerCase();

    if (
        state.isConfirmationPending === true &&
        (lastMessage === 'yes' ||
            lastMessage === 'perfect' ||
            lastMessage === 'confirm' ||
            lastMessage.includes('create it') ||
            lastMessage === 'ok')
    ) {
        // User confirmed!
        return { isComplete: true };
    }

    // Otherwise, present the task for confirmation
    const content = await generateConfirmationPrompt(state.partialTask);

    return {
        messages: [new AIMessage(content)],
        isConfirmationPending: true,
    };
};

// Node: Save Task
export const saveTaskNode = async (state: typeof TaskStateAnnotation.State) => {
    console.log('Saving task...');

    if (state.isComplete) {
        // createTaskTool returns a JSON string of the task
        const toolResult = await createTaskTool.invoke({
            userId: state.userId,
            title: state.partialTask.title!,
            summary: state.partialTask.summary || '',
            type: state.partialTask.type as any,
            data: state.partialTask.data || {},
            remindViaEmail: state.partialTask.remindViaEmail ?? state.partialTask.data?.remindViaEmail,
        });

        const newTask = JSON.parse(toolResult);
        const isReminder = newTask.type === 'reminder';
        const needsEmailPrompt = isReminder && !newTask.remindViaEmail;

        let message = `Task "${newTask.title}" created successfully!`;
        if (needsEmailPrompt) {
            message += "\n\nWould you like me to also remind you via email?";
        }

        return {
            messages: [new AIMessage(message)],
            partialTask: {},
            lastCreatedTaskId: newTask.id, // Always preserve ID for context
            isWaitingForEmailChoice: needsEmailPrompt,
            isComplete: false,
            isConfirmationPending: false,
        };
    }

    return {};
};

export const routeNode = (state: typeof TaskStateAnnotation.State) => {
    // If we just handled an email choice or other completion, end the flow
    if (state.isDone) {
        return END;
    }
    if (state.isComplete) {
        return 'saveTask';
    }
    if (state.error) {
        return END;
    }
    if (state.isConfirmationPending) {
        return 'confirmTask';
    }

    return 'askClarification';
};
