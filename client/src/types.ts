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
    sender: 'user' | 'bot';
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
    summary?: string;
    keywords?: string[];
    feedback?: string;
    suggestedTodos?: SuggestedTodo[];
}

export interface UserKeyword {
    id: string;
    userId: string;
    keyword: string;
    count: number;
    lastSeen: string;
}
