import { ReflectionEntry, Todo, User } from '../types';

// In-memory database implementation
// In production, replace this with actual database (PostgreSQL, MongoDB, etc.)
export class InMemoryDatabase {
    private users = new Map<string, User>();
    private reflections = new Map<string, ReflectionEntry>();
    private todos = new Map<string, Todo>();

    // User operations
    async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        const user: User = {
            id: this.generateId(),
            createdAt: new Date(),
            ...userData
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
            ...reflectionData
        };
        this.reflections.set(reflection.id, reflection);



        return reflection;
    }

    async getReflection(reflectionId: string): Promise<ReflectionEntry | null> {
        return this.reflections.get(reflectionId) || null;
    }

    async updateReflection(reflectionId: string, updates: Partial<ReflectionEntry>): Promise<ReflectionEntry | null> {
        const reflection = this.reflections.get(reflectionId);
        if (!reflection) return null;

        const updatedReflection = { ...reflection, ...updates };
        this.reflections.set(reflectionId, updatedReflection);
        return updatedReflection;
    }

    async getUserReflections(userId: string, limit?: number, offset?: number): Promise<ReflectionEntry[]> {
        const userReflections = Array.from(this.reflections.values())
            .filter(reflection => reflection.userId === userId)
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
        const associatedTodos = Array.from(this.todos.values())
            .filter(todo => todo.sourceReflectionId === reflectionId);

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
            ...todoData
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
        if (updates.completed && !todo.completed) {
            updatedTodo.completedAt = new Date();
        } else if (updates.completed === false && todo.completed) {
            updatedTodo.completedAt = undefined;
        }

        this.todos.set(todoId, updatedTodo);
        return updatedTodo;
    }

    async getUserTodos(userId: string): Promise<Todo[]> {
        return Array.from(this.todos.values())
            .filter(todo => todo.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async deleteTodo(todoId: string): Promise<boolean> {
        return this.todos.delete(todoId);
    }

    // Utility methods
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export/import for backup/restore
    async exportData(): Promise<{
        users: User[];
        reflections: ReflectionEntry[];
        todos: Todo[];
    }> {
        return {
            users: Array.from(this.users.values()),
            reflections: Array.from(this.reflections.values()),
            todos: Array.from(this.todos.values())
        };
    }

    async importData(data: {
        users: User[];
        reflections: ReflectionEntry[];
        todos: Todo[];
    }): Promise<void> {
        // Clear existing data
        this.users.clear();
        this.reflections.clear();
        this.todos.clear();

        // Import data
        data.users.forEach(user => this.users.set(user.id, user));
        data.reflections.forEach(reflection => this.reflections.set(reflection.id, reflection));
        data.todos.forEach(todo => this.todos.set(todo.id, todo));
    }
}

// Export singleton instance
export const database = new InMemoryDatabase();
