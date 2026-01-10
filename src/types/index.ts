export interface Message {
    id: string;
    sender: 'user' | 'bot';
    content: string;
    timestamp: Date;
    analysisData?: any; // Avoiding circular dependency with AnalysisResult if complex
}

export interface ReflectionEntry {
    id: string;
    userId: string;
    type: 'morning' | 'evening';
    timestamp: Date;
    content: string;
    title?: string;
    keywords?: string[] | null;
    summary?: string;
    feedback?: string;
    isCompleted?: boolean;
    messages?: Message[];
}

export interface Todo {
    id: string;
    userId: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    createdAt: Date;
    completedAt?: Date;
    sourceReflectionId?: string;
    priority: 'low' | 'medium' | 'high';
}

export interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    preferences: {
        feedbackStyle: 'encouraging' | 'direct' | 'questioning';
        moodTrackingEnabled: boolean;
        summaryFrequency: 'daily' | 'weekly' | 'never';
    };
    emailAccounts?: EmailAccount[];
    isGmailConnected?: boolean;
}

export interface EmailAccount {
    id: string;
    email: string;
    provider: 'gmail' | 'outlook' | 'custom';
    type: 'smtp_imap' | 'oauth2';
    imap?: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };
    smtp?: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };
    oauth?: OAuthTokens;
    isConnected: boolean;
    lastSynced?: Date;
}

export interface OAuthTokens {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    tokenType: string;
    scope: string;
}

export interface MobileAPIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}

export interface UserKeyword {
    id: string;
    userId: string;
    keyword: string;
    count: number;
    lastSeen: Date;
}

export interface EmailMessage {
    id: string;
    from: string;
    to: string;
    subject: string;
    content: string;
    timestamp: Date;
    hasReplied: boolean;
}
