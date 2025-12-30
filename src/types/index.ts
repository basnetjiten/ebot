export interface ReflectionEntry {
    id: string;
    userId: string;
    type: 'morning' | 'evening';
    timestamp: Date;
    content: string;
    goals?: string[];
    mood?: MoodAnalysis | null;
    summary?: string;
    feedback?: string;
    completed?: boolean;
}

export interface MoodAnalysis {
    score: number; // -1 to 1 (negative to positive)
    emotions: string[];
    intensity: number; // 0 to 1
    confidence: number; // 0 to 1
}

export interface Goal {
    id: string;
    userId: string;
    title: string;
    description: string;
    targetDate?: Date;
    status: 'active' | 'completed' | 'paused';
    createdAt: Date;
    updatedAt: Date;
    reflectionEntries: string[]; // IDs of related reflection entries
}

export interface Todo {
    id: string;
    userId: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    completedAt?: Date;
    sourceReflectionId?: string; // ID of reflection that generated this todo
    priority: 'low' | 'medium' | 'high';
}

export interface User {
    id: string;
    createdAt: Date;
    preferences: {
        feedbackStyle: 'encouraging' | 'direct' | 'questioning';
        moodTrackingEnabled: boolean;
        summaryFrequency: 'daily' | 'weekly' | 'never';
    };
}

export interface ReflectionAnalysis {
    mood: MoodAnalysis;
    summary: string;
    feedback: string;
    suggestedTodos: string[];
    goalAlignment: {
        aligned: boolean;
        suggestions: string[];
    };
}

export interface MobileAPIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}
