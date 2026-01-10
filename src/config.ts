import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    google: {
        apiKey: process.env.GOOGLE_API_KEY!,
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/callback',
    },
    mongodb: {
        uri: process.env.MONGODB_URI!,
        dbName: process.env.MONGODB_DB_NAME!,
        useMemoryDb: process.env.USE_MEMORY_DB === 'true',
    },
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'gemma3:4b',
    },
    // Add other config groups here
};

// Validation to catch missing critical variables early
if (!config.google.apiKey) {
    console.warn('WARNING: GOOGLE_API_KEY is not set in environment variables');
}

if (!config.mongodb.uri && !config.mongodb.useMemoryDb) {
    console.warn('WARNING: MONGODB_URI is not set in environment variables');
}
