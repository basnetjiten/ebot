import { z } from 'zod';

// Base schemas for shared fields can be useful, but since we want strict typing for each task type, we'll define them clearly.

export const TodoDataSchema = z.object({
    deadline: z.string().describe('ISO 8601 date string for when the task is due').optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
    subtasks: z.array(z.object({
        title: z.string(),
        completed: z.boolean().default(false)
    })).optional(),
    reminderTime: z.string().describe('ISO 8601 date string for when to send a reminder').optional(),
    remindViaEmail: z.boolean().describe('Whether to send an email reminder').optional(),
}).describe('Data specific to a Todo task');

export const EventDataSchema = z.object({
    startTime: z.string().describe('ISO 8601 date string for event start'),
    endTime: z.string().describe('ISO 8601 date string for event end'),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    url: z.string().optional(),
}).describe('Data specific to an Event task');

export const HabitDataSchema = z.object({
    frequency: z.string().describe('Frequency of the habit, e.g., "daily", "weekly", "Mon,Wed,Fri"'),
    timeOfDay: z.string().describe('Preferred time of day for the habit, e.g., "07:00"').optional(),
    targetStreak: z.number().optional(),
}).describe('Data specific to a Habit task');

export const ReminderDataSchema = z.object({
    triggerTime: z.string().describe('ISO 8601 date string for the reminder trigger'),
    isRecurring: z.boolean().optional(),
    recurrencePattern: z.string().optional(),
    remindViaEmail: z.boolean().optional(),
}).describe('Data specific to a Reminder task');

// Combined Data Schema - used for the extraction output where we might not know the type yet, 
// OR we can make the parent object a discriminated union.
// For LangChain tools, it's often easier to have a single "extraction" tool that has optional fields 
// or a discriminated union if the model supports it well. 
// Gemini supports them reasonably well.

export const TaskExtractionSchema = z.object({
    type: z.enum(['todo', 'event', 'habit', 'reminder']).describe('The type of task being created or updated'),
    title: z.string().describe('The title of the task'),
    summary: z.string().describe('A friendly, user-facing summary of the task plan (using local time for display)'),

    // We use a loose object for data here because we want to capture whatever the model sends, 
    // and validte it later using the specific schemas, OR we can try to make it strict.
    // To properly support updates, we make fields optional. 
    // Let's try to define a union for `data` but that can be tricky with partial updates.
    // For simplicity in extraction + update logic, let's keep `data` flattened or meaningful.
    // Actually, sticking to the existing pattern of a nested `data` object is good for database structure.

    // Let's define `data` as an object that CAN contain any of the fields from the schemas above.
    // The easiest way for a robust extraction tool is often to flatten the properties into the tool call 
    // and then reconstruct the object, BUT keeping them separate effectively namespaces them.
    // Let's use a flexible record for now to avoid Zod union complexities with "Partial" updates.
    // The model is smart enough to put the right fields in `data`.
    data: z.record(z.string(), z.any()).describe('The specific details of the task (e.g. startTime, priority, etc.)'),

    isUpdate: z.boolean().describe('Set to true if this request is modifying an existing task context').optional(),
    conversationalResponse: z.string().describe('A warm, friendly response in valid JSON (no markdown) acknowledging the user request'),

    missingFields: z.array(z.object({
        field: z.string(),
        reason: z.string(),
        suggestedQuestion: z.string()
    })).describe('List of fields that are required but missing from the user request').optional(),

    validationErrors: z.array(z.string()).describe('List of any logic validation errors').optional()
}).describe('The structured output representing a user task request');
