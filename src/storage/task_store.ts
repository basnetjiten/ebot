import { MongoClient, Collection, Db, ObjectId } from 'mongodb';
import { Task } from '../types/task';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export class TaskStore {
    private client: MongoClient;
    private db: Db | null = null;
    private tasks: Collection<Task> | null = null;
    private connectionPromise: Promise<void> | null = null;

    constructor() {
        // Create a SEPARATE connection for tasks as requested
        this.client = new MongoClient(config.mongodb.uri);
        this.connectionPromise = this.connect();
    }

    private async connect() {
        try {
            await this.client.connect();
            // Using a specific DB name for tasks if we want complete separation,
            // or same DB but different connection instance.
            // The prompt asked for "separate entity and db connections".
            // We will use the configured DB name but this is a distinct connection.
            this.db = this.client.db(config.mongodb.dbName);
            this.tasks = this.db.collection<Task>('ebot_tasks');
            console.log('Connected to MongoDB for Tasks (Separate Connection)');
        } catch (error) {
            console.error('Failed to connect to MongoDB for Tasks', error);
            throw error;
        }
    }

    private async ensureConnection() {
        if (this.connectionPromise) {
            await this.connectionPromise;
        }
        if (!this.db || !this.tasks) {
            throw new Error('Task Database not connected');
        }
    }

    async createTask(taskData: any): Promise<Task> {
        await this.ensureConnection();
        const doc = {
            ...taskData,
            _id: new ObjectId(),
            createdAt: new Date(),
        };
        await this.tasks!.insertOne(doc as any);
        return {
            ...taskData,
            id: doc._id.toHexString(),
            createdAt: doc.createdAt,
        };
    }

    async getTasks(userId: string): Promise<Task[]> {
        await this.ensureConnection();
        const results = await this.tasks!.find({ userId } as any)
            .sort({ createdAt: -1 }) // Sort by newest first by default
            .toArray();

        return results.map((doc) => ({
            ...doc,
            id: (doc as any)._id.toHexString(),
        })) as unknown as Task[];
    }

    async getDueTasks(): Promise<Task[]> {
        await this.ensureConnection();
        const now = new Date().toISOString();

        console.log(`[TaskStore] Querying for due tasks. Current time (ISO): ${now}`);

        // First, let's see ALL pending tasks for debugging
        const allPending = await this.tasks!.find({ status: 'pending' } as any).toArray();
        console.log(`[TaskStore] Total pending tasks in DB: ${allPending.length}`);

        if (allPending.length > 0) {
            allPending.forEach((task: any) => {
                const triggerTime = task.data?.triggerTime;
                const startTime = task.data?.startTime;
                console.log(`[TaskStore] Pending task: "${task.title}"`, {
                    triggerTime,
                    startTime,
                    triggerPassed: triggerTime ? triggerTime <= now : 'N/A',
                    startPassed: startTime ? startTime <= now : 'N/A',
                });
            });
        }

        // Find pending tasks where triggerTime or startTime has passed
        const results = await this.tasks!
            .find({
                status: 'pending',
                $or: [
                    { 'data.triggerTime': { $lte: now } },
                    { 'data.startTime': { $lte: now } },
                ],
            } as any)
            .toArray();

        console.log(`[TaskStore] Found ${results.length} pending tasks with past trigger/start times`);

        const mapped = results.map((doc) => ({
            ...doc,
            id: (doc as any)._id.toHexString(),
        })) as unknown as Task[];

        return mapped;
    }

    async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | null> {
        return this.updateTask(taskId, { status });
    }

    async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
        await this.ensureConnection();
        const result = await this.tasks!.findOneAndUpdate(
            { _id: new ObjectId(taskId) } as any,
            { $set: updates },
            { returnDocument: 'after' },
        );
        if (!result) return null;
        return {
            ...result,
            id: (result as any)._id.toHexString(),
        } as unknown as Task;
    }

    async deleteTask(taskId: string): Promise<boolean> {
        await this.ensureConnection();
        try {
            const result = await this.tasks!.deleteOne({ _id: new ObjectId(taskId) } as any);
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }
}

// Export singleton instance
export const taskStore = new TaskStore();
