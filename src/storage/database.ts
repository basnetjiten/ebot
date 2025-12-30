import { ReflectionEntry, Goal, Todo, User } from '../types';

// In-memory database implementation
// In production, replace this with actual database (PostgreSQL, MongoDB, etc.)
export class InMemoryDatabase {
    private users = new Map<string, User>();
    private reflections = new Map<string, ReflectionEntry>();
    private goals = new Map<string, Goal>();
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

        // Update associated goals if any
        if (reflection.goals && reflection.goals.length > 0) {
            for (const goalId of reflection.goals) {
                const goal = await this.getGoal(goalId);
                if (goal && !goal.reflectionEntries.includes(reflection.id)) {
                    goal.reflectionEntries.push(reflection.id);
                    await this.updateGoal(goalId, goal);
                }
            }
        }

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

        // Remove from associated goals
        for (const goalId of reflection.goals || []) {
            const goal = await this.getGoal(goalId);
            if (goal) {
                goal.reflectionEntries = goal.reflectionEntries.filter(id => id !== reflectionId);
                await this.updateGoal(goalId, goal);
            }
        }

        // Remove associated todos
        const associatedTodos = Array.from(this.todos.values())
            .filter(todo => todo.sourceReflectionId === reflectionId);

        for (const todo of associatedTodos) {
            this.todos.delete(todo.id);
        }

        return this.reflections.delete(reflectionId);
    }

    // Goal operations
    async createGoal(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
        const goal: Goal = {
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...goalData
        };
        this.goals.set(goal.id, goal);
        return goal;
    }

    async getGoal(goalId: string): Promise<Goal | null> {
        return this.goals.get(goalId) || null;
    }

    async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
        const goal = this.goals.get(goalId);
        if (!goal) return null;

        const updatedGoal = {
            ...goal,
            ...updates,
            updatedAt: new Date()
        };
        this.goals.set(goalId, updatedGoal);
        return updatedGoal;
    }

    async getUserGoals(userId: string): Promise<Goal[]> {
        return Array.from(this.goals.values())
            .filter(goal => goal.userId === userId)
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    async deleteGoal(goalId: string): Promise<boolean> {
        const goal = this.goals.get(goalId);
        if (!goal) return false;

        // Remove from associated reflections
        for (const reflectionId of goal.reflectionEntries) {
            const reflection = await this.getReflection(reflectionId);
            if (reflection && reflection.goals) {
                reflection.goals = reflection.goals.filter(id => id !== goalId);
                await this.updateReflection(reflectionId, reflection);
            }
        }

        return this.goals.delete(goalId);
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

    // Analytics operations
    async getMoodAnalytics(userId: string, period: 'day' | 'week' | 'month'): Promise<{
        period: string;
        averageMood: number;
        moodData: Array<{
            date: Date;
            score: number;
            emotions: string[];
            intensity: number;
        }>;
        totalReflections: number;
    }> {
        const userReflections = await this.getUserReflections(userId);
        const reflectionsWithMood = userReflections.filter(r => r.mood);

        // Calculate period cutoff
        const now = new Date();
        let cutoffDate: Date;

        switch (period) {
            case 'day':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        const periodReflections = reflectionsWithMood.filter(
            reflection => reflection.timestamp >= cutoffDate
        );

        const moodData = periodReflections.map(reflection => ({
            date: reflection.timestamp,
            score: reflection.mood!.score,
            emotions: reflection.mood!.emotions,
            intensity: reflection.mood!.intensity
        }));

        const averageMood = moodData.length > 0
            ? moodData.reduce((sum, data) => sum + data.score, 0) / moodData.length
            : 0;

        return {
            period,
            averageMood,
            moodData,
            totalReflections: periodReflections.length
        };
    }

    // Utility methods
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export/import for backup/restore
    async exportData(): Promise<{
        users: User[];
        reflections: ReflectionEntry[];
        goals: Goal[];
        todos: Todo[];
    }> {
        return {
            users: Array.from(this.users.values()),
            reflections: Array.from(this.reflections.values()),
            goals: Array.from(this.goals.values()),
            todos: Array.from(this.todos.values())
        };
    }

    async importData(data: {
        users: User[];
        reflections: ReflectionEntry[];
        goals: Goal[];
        todos: Todo[];
    }): Promise<void> {
        // Clear existing data
        this.users.clear();
        this.reflections.clear();
        this.goals.clear();
        this.todos.clear();

        // Import data
        data.users.forEach(user => this.users.set(user.id, user));
        data.reflections.forEach(reflection => this.reflections.set(reflection.id, reflection));
        data.goals.forEach(goal => this.goals.set(goal.id, goal));
        data.todos.forEach(todo => this.todos.set(todo.id, todo));
    }
}

// Export singleton instance
export const database = new InMemoryDatabase();
