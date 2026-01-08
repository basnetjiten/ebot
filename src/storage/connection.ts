import { MongoClient, Db } from 'mongodb';
import { config } from '../config';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<void> {
    if (client) {
        return;
    }

    try {
        console.log('Connecting to MongoDB...');
        client = new MongoClient(config.mongodb.uri);
        await client.connect();
        db = client.db(config.mongodb.dbName);
        console.log('Connected to MongoDB successfully.');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

export function getDb(): Db {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDatabase() first.');
    }
    return db;
}

export async function closeDatabase(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed.');
    }
}
