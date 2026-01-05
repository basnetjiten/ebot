export interface ReflectionEntry {
    id: string;
    userId: string;
    type: 'morning' | 'evening';
    timestamp: Date;
    content: string;
    keywords?: string[] | null;
    summary?: string;
    feedback?: string;
    completed?: boolean;
}



export interface Todo {
    id: string;
    userId: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    completedAt?: Date;
    sourceReflectionId?: string;
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



export interface MobileAPIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}
