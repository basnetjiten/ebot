import { AIMessage } from '@langchain/core/messages';
import { END } from '@langchain/langgraph';
import { TaskStateAnnotation } from './state';
import { TaskTools } from './tools';

// Node: Parse User Request
export const parseRequestNode = async (state: typeof TaskStateAnnotation.State) => {
    console.log('Parsing request...');

    try {
        const extracted = await TaskTools.extractTaskDetails(state.messages, state.partialTask);

        // Merge with existing partial task
        const updatedTask = {
            type: extracted.type,
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

    const content = TaskTools.generateClarificationContent(
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
    const content = await TaskTools.generateConfirmationPrompt(state.partialTask);

    return {
        messages: [new AIMessage(content)],
        isConfirmationPending: true,
    };
};

// Node: Save Task
export const saveTaskNode = async (state: typeof TaskStateAnnotation.State) => {
    console.log('Saving task...');

    if (state.isComplete) {
        const newTask = await TaskTools.createTask(state.userId, state.partialTask);

        return {
            messages: [new AIMessage(`Task "${newTask.title}" created successfully!`)],
            partialTask: {},
            isComplete: false,
            isConfirmationPending: false,
        };
    }

    return {};
};

export const routeNode = (state: typeof TaskStateAnnotation.State) => {
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
