export interface SuggestedTodo {
    id: string;
    title: string;
    isCompleted: boolean;
    description: string;
    priority: 'low' | 'medium' | 'high';
    sourceReflectionId?: string;
}

export interface AnalysisResult {
    summary: string;
    keywords?: string[];
    suggestedTodos?: SuggestedTodo[];
    feedback?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    analysisData?: AnalysisResult;
}

export interface ReflectionEntry {
    id: string;
    userId: string;
    timestamp: string;
    content: string;
    type: 'morning' | 'evening';
    title?: string;
    summary?: string;
    keywords?: string[];
    feedback?: string;
    suggestedTodos?: SuggestedTodo[];
    messages?: Message[];
}

export interface UserKeyword {
    id: string;
    userId: string;
    keyword: string;
    count: number;
    lastSeen: string;
}
