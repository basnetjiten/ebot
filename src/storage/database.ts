import { MongoClient, Collection, Db } from 'mongodb';
import { ReflectionEntry, Todo, User, UserKeyword, EmailAccount } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface IDatabase {
    createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User>;
    getUser(userId: string): Promise<User | null>;
    updateUser(userId: string, updates: Partial<User>): Promise<User | null>;
    createReflection(reflectionData: Omit<ReflectionEntry, 'id'>): Promise<ReflectionEntry>;
    getReflection(reflectionId: string): Promise<ReflectionEntry | null>;
    updateReflection(
        reflectionId: string,
        updates: Partial<ReflectionEntry>,
    ): Promise<ReflectionEntry | null>;
    getUserReflections(userId: string, limit?: number, offset?: number): Promise<ReflectionEntry[]>;
    deleteReflection(reflectionId: string): Promise<boolean>;
    createTodo(todoData: Omit<Todo, 'id' | 'createdAt'>): Promise<Todo>;
    getTodo(todoId: string): Promise<Todo | null>;
    updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo | null>;
    getUserTodos(userId: string): Promise<Todo[]>;
    deleteTodo(todoId: string): Promise<boolean>;
    saveKeywords(userId: string, keywords: string[]): Promise<void>;
    getTodosByReflectionId(reflectionId: string): Promise<Todo[]>;
    getUserKeywords(userId: string): Promise<UserKeyword[]>;
    addEmailAccount(userId: string, account: Omit<EmailAccount, 'id'>): Promise<EmailAccount>;
    getEmailAccounts(userId: string): Promise<EmailAccount[]>;
    updateEmailAccount(
        userId: string,
        accountId: string,
        updates: Partial<EmailAccount>,
    ): Promise<EmailAccount | null>;
    deleteEmailAccount(userId: string, accountId: string): Promise<boolean>;
    getLatestReflection(userId: string): Promise<ReflectionEntry | null>;
}

// In-memory database implementation
export class InMemoryDatabase implements IDatabase {
    private users = new Map<string, User>();
    private reflections = new Map<string, ReflectionEntry>();
    private todos = new Map<string, Todo>();
    private keywords = new Map<string, { keyword: string; count: number; lastSeen: Date }[]>();

    // User operations
    async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        const user: User = {
            id: this.generateId(),
            createdAt: new Date(),
            ...userData,
        };
        this.users.set(user.id, user);
        return user;
    }

    async getUser(userId: string): Promise<User | null> {
        return this.users.get(userId) || null;
    }

    async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
        const user = this.users.get(userId);
        if (!user) return null;

        const updatedUser = { ...user, ...updates };
        this.users.set(userId, updatedUser);
        return updatedUser;
    }

    // Reflection operations
    async createReflection(reflectionData: Omit<ReflectionEntry, 'id'>): Promise<ReflectionEntry> {
        const reflection: ReflectionEntry = {
            id: this.generateId(),
            ...reflectionData,
        };
        this.reflections.set(reflection.id, reflection);
        return reflection;
    }

    async getReflection(reflectionId: string): Promise<ReflectionEntry | null> {
        return this.reflections.get(reflectionId) || null;
    }

    async updateReflection(
        reflectionId: string,
        updates: Partial<ReflectionEntry>,
    ): Promise<ReflectionEntry | null> {
        const reflection = this.reflections.get(reflectionId);
        if (!reflection) return null;

        const updatedReflection = { ...reflection, ...updates };
        this.reflections.set(reflectionId, updatedReflection);
        return updatedReflection;
    }

    async getUserReflections(
        userId: string,
        limit?: number,
        offset?: number,
    ): Promise<ReflectionEntry[]> {
        const userReflections = Array.from(this.reflections.values())
            .filter((reflection) => reflection.userId === userId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        if (offset !== undefined) {
            userReflections.splice(0, offset);
        }

        if (limit !== undefined) {
            return userReflections.slice(0, limit);
        }

        return userReflections;
    }

    async deleteReflection(reflectionId: string): Promise<boolean> {
        const reflection = this.reflections.get(reflectionId);
        if (!reflection) return false;

        // Remove associated todos
        const associatedTodos = Array.from(this.todos.values()).filter(
            (todo) => todo.sourceReflectionId === reflectionId,
        );

        for (const todo of associatedTodos) {
            this.todos.delete(todo.id);
        }

        return this.reflections.delete(reflectionId);
    }

    // Todo operations
    async createTodo(todoData: Omit<Todo, 'id' | 'createdAt'>): Promise<Todo> {
        const todo: Todo = {
            id: this.generateId(),
            createdAt: new Date(),
            ...todoData,
        };
        this.todos.set(todo.id, todo);
        return todo;
    }

    async getTodo(todoId: string): Promise<Todo | null> {
        return this.todos.get(todoId) || null;
    }

    async updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo | null> {
        const todo = this.todos.get(todoId);
        if (!todo) return null;

        const updatedTodo = { ...todo, ...updates };
        if (updates.isCompleted && !todo.isCompleted) {
            updatedTodo.completedAt = new Date();
        } else if (updates.isCompleted === false && todo.isCompleted) {
            updatedTodo.completedAt = undefined;
        }

        this.todos.set(todoId, updatedTodo);
        return updatedTodo;
    }

    async getUserTodos(userId: string): Promise<Todo[]> {
        return Array.from(this.todos.values())
            .filter((todo) => todo.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async deleteTodo(todoId: string): Promise<boolean> {
        return this.todos.delete(todoId);
    }

    async saveKeywords(userId: string, keywords: string[]): Promise<void> {
        const userKeywords = this.keywords.get(userId) || [];
        for (const kw of keywords) {
            const existing = userKeywords.find((k) => k.keyword === kw);
            if (existing) {
                existing.count++;
                existing.lastSeen = new Date();
            } else {
                userKeywords.push({ keyword: kw, count: 1, lastSeen: new Date() });
            }
        }
        this.keywords.set(userId, userKeywords);
    }

    async getTodosByReflectionId(reflectionId: string): Promise<Todo[]> {
        return Array.from(this.todos.values()).filter(
            (todo) => todo.sourceReflectionId === reflectionId,
        );
    }

    async getUserKeywords(userId: string): Promise<UserKeyword[]> {
        const userKeywords = this.keywords.get(userId) || [];
        return userKeywords.map((k, i) => ({
            id: `kw - ${i} `,
            userId,
            keyword: k.keyword,
            count: k.count,
            lastSeen: k.lastSeen,
        }));
    }

    // Email account operations
    async addEmailAccount(
        userId: string,
        accountData: Omit<EmailAccount, 'id'>,
    ): Promise<EmailAccount> {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');

        const account: EmailAccount = {
            id: this.generateId(),
            ...accountData,
        };

        user.emailAccounts = [...(user.emailAccounts || []), account];
        if (account.provider === 'gmail') {
            user.isGmailConnected = true;
        }
        this.users.set(userId, user);
        return account;
    }

    async getEmailAccounts(userId: string): Promise<EmailAccount[]> {
        const user = this.users.get(userId);
        return user?.emailAccounts || [];
    }

    async updateEmailAccount(
        userId: string,
        accountId: string,
        updates: Partial<EmailAccount>,
    ): Promise<EmailAccount | null> {
        const user = this.users.get(userId);
        if (!user || !user.emailAccounts) return null;

        const index = user.emailAccounts.findIndex((a) => a.id === accountId);
        if (index === -1) return null;

        user.emailAccounts[index] = { ...user.emailAccounts[index], ...updates };
        this.users.set(userId, user);
        return user.emailAccounts[index];
    }

    async deleteEmailAccount(userId: string, accountId: string): Promise<boolean> {
        const user = this.users.get(userId);
        if (!user || !user.emailAccounts) return false;

        const initialLength = user.emailAccounts.length;
        user.emailAccounts = user.emailAccounts.filter((a) => a.id !== accountId);

        if (user.emailAccounts.length !== initialLength) {
            // Check if any gmail accounts remain
            const stillHasGmail = user.emailAccounts.some((a) => a.provider === 'gmail');
            user.isGmailConnected = stillHasGmail;
            this.users.set(userId, user);
            return true;
        }
        return false;
    }

    async getLatestReflection(userId: string): Promise<ReflectionEntry | null> {
        const reflections = await this.getUserReflections(userId, 1);
        return reflections.length > 0 ? reflections[0] : null;
    }

    // Utility methods
    private generateId(): string {
        return uuidv4();
    }
}

import { getDb } from './connection';

export class MongoDatabase implements IDatabase {
    // Only typed as getters or just access directly via getDb()
    // But to keep code changes minimal in methods, we can use getters or helper method.
    // Actually methods access this.users, this.reflections etc.
    // We can make these getters that pull from getDb().

    private get db(): Db {
        return getDb();
    }

    private get users(): Collection<User> {
        return this.db.collection<User>('ebot_users');
    }

    private get reflections(): Collection<ReflectionEntry> {
        return this.db.collection<ReflectionEntry>('ebot_reflections');
    }

    private get todos(): Collection<Todo> {
        return this.db.collection<Todo>('ebot_todos');
    }

    private get keywords(): Collection<any> {
        return this.db.collection('ebot_keywords');
    }

    constructor() {
        // No connection logic here
    }

    // Helper to match existing signature pattern if needed, or remove calls to it.
    // The implementation plan says "Update ensureConnection to call getDb()".
    // existing methods call `await this.ensureConnection()`.
    // We can make ensureConnection a no-op or just check getDb.
    private async ensureConnection() {
        getDb(); // Throws if not connected
    }

    // User operations
    async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        await this.ensureConnection();
        const user: User = {
            id: uuidv4(),
            createdAt: new Date(),
            ...userData,
        };
        await this.users!.insertOne(user as any);
        return user;
    }

    async getUser(userId: string): Promise<User | null> {
        await this.ensureConnection();
        return (await this.users!.findOne({ id: userId } as any)) as User | null;
    }

    async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
        await this.ensureConnection();
        const result = await this.users!.findOneAndUpdate(
            { id: userId } as any,
            { $set: updates },
            { returnDocument: 'after' },
        );
        return result as User | null;
    }

    // Reflection operations
    async createReflection(reflectionData: Omit<ReflectionEntry, 'id'>): Promise<ReflectionEntry> {
        await this.ensureConnection();
        const reflection: ReflectionEntry = {
            id: uuidv4(),
            ...reflectionData,
        };
        await this.reflections!.insertOne(reflection as any);
        return reflection;
    }

    async getReflection(reflectionId: string): Promise<ReflectionEntry | null> {
        await this.ensureConnection();
        return (await this.reflections!.findOne({
            id: reflectionId,
        } as any)) as ReflectionEntry | null;
    }

    async updateReflection(
        reflectionId: string,
        updates: Partial<ReflectionEntry>,
    ): Promise<ReflectionEntry | null> {
        await this.ensureConnection();
        const result = await this.reflections!.findOneAndUpdate(
            { id: reflectionId } as any,
            { $set: updates },
            { returnDocument: 'after' },
        );
        return result as ReflectionEntry | null;
    }

    async getUserReflections(
        userId: string,
        limit?: number,
        offset?: number,
    ): Promise<ReflectionEntry[]> {
        await this.ensureConnection();
        let query = this.reflections!.find({ userId } as any).sort({ timestamp: -1 });

        if (offset !== undefined) {
            query = query.skip(offset);
        }

        if (limit !== undefined) {
            query = query.limit(limit);
        }

        const results = await query.toArray();
        return results as ReflectionEntry[];
    }

    async deleteReflection(reflectionId: string): Promise<boolean> {
        await this.ensureConnection();

        // Remove associated todos
        await this.todos!.deleteMany({ sourceReflectionId: reflectionId } as any);

        const result = await this.reflections!.deleteOne({ id: reflectionId } as any);
        return result.deletedCount > 0;
    }

    // Todo operations
    async createTodo(todoData: Omit<Todo, 'id' | 'createdAt'>): Promise<Todo> {
        await this.ensureConnection();
        const todo: Todo = {
            id: uuidv4(),
            createdAt: new Date(),
            ...todoData,
        };
        await this.todos!.insertOne(todo as any);
        return todo;
    }

    async getTodo(todoId: string): Promise<Todo | null> {
        await this.ensureConnection();
        return (await this.todos!.findOne({ id: todoId } as any)) as Todo | null;
    }

    async updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo | null> {
        await this.ensureConnection();

        const updateDoc: any = { $set: updates };

        if (updates.isCompleted === true) {
            updateDoc.$set.completedAt = new Date();
        } else if (updates.isCompleted === false) {
            updateDoc.$unset = { completedAt: '' };
        }

        const result = await this.todos!.findOneAndUpdate({ id: todoId } as any, updateDoc, {
            returnDocument: 'after',
        });
        return result as Todo | null;
    }

    async getUserTodos(userId: string): Promise<Todo[]> {
        await this.ensureConnection();
        const results = await this.todos!.find({ userId } as any)
            .sort({ createdAt: -1 })
            .toArray();
        return results as Todo[];
    }

    async deleteTodo(todoId: string): Promise<boolean> {
        await this.ensureConnection();
        const result = await this.todos!.deleteOne({ id: todoId } as any);
        return result.deletedCount > 0;
    }

    async saveKeywords(userId: string, keywords: string[]): Promise<void> {
        await this.ensureConnection();
        for (const kw of keywords) {
            await this.keywords!.updateOne(
                { userId, keyword: kw },
                {
                    $inc: { count: 1 },
                    $set: { lastSeen: new Date() },
                    $setOnInsert: { id: uuidv4() },
                },
                { upsert: true },
            );
        }
    }

    async getTodosByReflectionId(reflectionId: string): Promise<Todo[]> {
        await this.ensureConnection();
        const results = await this.todos!.find({
            sourceReflectionId: reflectionId,
        } as any).toArray();
        return results as Todo[];
    }

    async getUserKeywords(userId: string): Promise<UserKeyword[]> {
        await this.ensureConnection();
        const results = await this.keywords!.find({ userId } as any)
            .sort({ count: -1 })
            .toArray();
        return results as UserKeyword[];
    }

    // Email account operations
    async addEmailAccount(
        userId: string,
        accountData: Omit<EmailAccount, 'id'>,
    ): Promise<EmailAccount> {
        await this.ensureConnection();

        const user = await this.getUser(userId);
        if (!user) {
            // Create user if not exists (should already exist though)
            const newUser: User = {
                id: userId,
                createdAt: new Date(),
                preferences: {
                    feedbackStyle: 'encouraging',
                    moodTrackingEnabled: true,
                    summaryFrequency: 'daily',
                },
                emailAccounts: [],
                isGmailConnected: false,
            };
            await this.users!.insertOne(newUser as any);
        }

        const updatedUser = await this.getUser(userId);
        const accounts = updatedUser?.emailAccounts || [];
        const existingIndex = accounts.findIndex((a) => a.email === accountData.email);

        let account: EmailAccount;
        if (existingIndex > -1) {
            account = { ...accounts[existingIndex], ...accountData };
            accounts[existingIndex] = account;
        } else {
            account = { id: uuidv4(), ...accountData };
            accounts.push(account);
        }

        const updateDoc: any = {
            $set: {
                emailAccounts: accounts,
                isGmailConnected: accounts.some((a) => a.provider === 'gmail' && a.isConnected),
            },
        };

        await this.users!.updateOne({ id: userId } as any, updateDoc);

        return account;
    }

    async getEmailAccounts(userId: string): Promise<EmailAccount[]> {
        await this.ensureConnection();
        const user = await this.users!.findOne({ id: userId } as any);
        return user?.emailAccounts || [];
    }

    async updateEmailAccount(
        userId: string,
        accountId: string,
        updates: Partial<EmailAccount>,
    ): Promise<EmailAccount | null> {
        await this.ensureConnection();

        // MongoDB positional operator to update specific element in array
        const updateDoc: any = {};
        for (const [key, value] of Object.entries(updates)) {
            updateDoc[`emailAccounts.$.${key}`] = value;
        }

        const result = await this.users!.findOneAndUpdate(
            { id: userId, 'emailAccounts.id': accountId } as any,
            { $set: updateDoc } as any,
            { returnDocument: 'after' },
        );

        if (!result) return null;
        const updatedUser = result as User;
        return updatedUser.emailAccounts?.find((a) => a.id === accountId) || null;
    }

    async deleteEmailAccount(userId: string, accountId: string): Promise<boolean> {
        await this.ensureConnection();

        // Remove the account
        const result = await this.users!.updateOne(
            { id: userId } as any,
            { $pull: { emailAccounts: { id: accountId } } } as any,
        );

        if (result.modifiedCount > 0) {
            // Check if any gmail accounts remain to update the flag
            const user = await this.getUser(userId);
            if (user) {
                const stillHasGmail =
                    user.emailAccounts?.some((a) => a.provider === 'gmail') || false;
                await this.users!.updateOne(
                    { id: userId } as any,
                    { $set: { isGmailConnected: stillHasGmail } } as any,
                );
            }
            return true;
        }
        return false;
    }

    async getLatestReflection(userId: string): Promise<ReflectionEntry | null> {
        await this.ensureConnection();
        const result = await this.reflections!.findOne({ userId } as any, {
            sort: { timestamp: -1 },
        });
        return result as ReflectionEntry | null;
    }
}

// Export singleton instance
import { config } from '../config';

export const database: IDatabase = config.mongodb.useMemoryDb
    ? new InMemoryDatabase()
    : new MongoDatabase();
