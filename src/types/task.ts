import { BaseMessage } from "@langchain/core/messages";

export type TaskType = 'todo' | 'event' | 'habit' | 'reminder';

export interface BaseTask {
    id: string;
    userId: string;
    title: string;
    summary?: string;
    type: TaskType;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    metadata?: Record<string, any>; // AI confidence, tags
    createdAt: Date;
}

export interface TodoTask extends BaseTask {
    type: 'todo';
    data: {
        deadline?: string;
        priority?: 'low' | 'medium' | 'high';
        subtasks?: { title: string; completed: boolean }[];
    };
}

export interface EventTask extends BaseTask {
    type: 'event';
    data: {
        startTime: string;
        endTime: string;
        location?: string;
        attendees?: string[];
        url?: string;
    };
}

export interface HabitTask extends BaseTask {
    type: 'habit';
    data: {
        frequency: string; // e.g., "daily", "weekly", "Mon,Wed,Fri"
        timeOfDay?: string;
        targetStreak?: number;
        currentStreak?: number;
    };
}

export interface ReminderTask extends BaseTask {
    type: 'reminder';
    data: {
        time: string;
        isRecurring?: boolean;
        recurrencePattern?: string;
    };
}

export type Task = TodoTask | EventTask | HabitTask | ReminderTask;

export interface TaskAgentState {
    messages: any[];
    userId: string;
    partialTask: Partial<Task>;
    missingFields: string[]; // Still useful to track what AI *thinks* is missing based on its own generated schema? 
    // Actually if schema is dynamic, "missing" is relative. 
    // The AI deciding what is missing is part of the new prompt logic.
    isConfirmationPending: boolean;
    isComplete: boolean;
    error?: string;
}

export interface TaskAPIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}
