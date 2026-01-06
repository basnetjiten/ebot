import { Request, Response } from 'express';
import { compiledAgent } from '../agent';
import { MobileAPIResponse } from '../types';
import { database } from '../storage/database';

// Helper function to create API response
const createResponse = <T>(data?: T, error?: string): MobileAPIResponse<T> => ({
    success: !error,
    data,
    error,
    timestamp: new Date()
});

// Submit a reflection entry for analysis
export const submitReflection = async (req: Request, res: Response) => {
    try {
        const { userId, type, content, messages, lastReflectionId } = req.body;

        if (!userId || !type || !content) {
            return res.status(400).json(
                createResponse(null, 'Missing required fields: userId, type, content')
            );
        }

        if (!['morning', 'evening'].includes(type)) {
            return res.status(400).json(
                createResponse(null, 'Type must be either "morning" or "evening"')
            );
        }

        // Ensure user exists
        let user = await database.getUser(userId);
        if (!user) {
            console.log(`User ${userId} not found, creating new user...`);
            user = await database.createUser({
                id: userId,
                preferences: {
                    feedbackStyle: 'encouraging',
                    moodTrackingEnabled: true,
                    summaryFrequency: 'daily'
                }
            } as any);
        }

        // Create reflection entry
        const reflectionData = {
            userId,
            type,
            timestamp: new Date(),
            content,
        };

        // Store reflection
        const reflection = await database.createReflection(reflectionData);

        // Run the reflection analysis agent
        const result = await compiledAgent.invoke({
            userId,
            currentReflection: reflection,
            currentStep: 'initial',
            analysisComplete: false,
            messages: messages || [],
            suggestedTodos: [],
            createdTodos: [],
            keywordAnalysis: [],
            summary: '',
            feedback: '',
            error: null
        });

        // Update reflection with analysis results
        const updatedReflection = result.currentReflection;
        if (updatedReflection) {
            await database.updateReflection(reflection.id, updatedReflection);
        }

        // Store suggested todos
        if (result.suggestedTodos && result.suggestedTodos.length > 0) {
            for (const todo of result.suggestedTodos) {
                await database.createTodo(todo);
            }
        }

        // Save keywords to user_keywords collection
        if (result.keywordAnalysis && result.keywordAnalysis.length > 0) {
            await database.saveKeywords(userId, result.keywordAnalysis);
        }

        res.json(createResponse({
            content: updatedReflection?.content,
            reflection: updatedReflection,
            analysis: {
                keywords: result.keywordAnalysis,
                summary: result.summary,
                feedback: result.feedback,
                suggestedTodos: result.suggestedTodos
            }
        }));

    } catch (error) {
        console.error('Error processing reflection:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};

// Get user's reflection history
export const getReflectionHistory = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { limit, offset } = req.query;

        if (!userId) {
            return res.status(400).json(
                createResponse(null, 'User ID is required')
            );
        }

        const userReflections = await database.getUserReflections(
            userId,
            limit ? parseInt(limit as string) : undefined,
            offset ? parseInt(offset as string) : undefined
        );

        res.json(createResponse(userReflections));

    } catch (error) {
        console.error('Error fetching reflection history:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};

// Update todo status
export const updateTodoStatus = async (req: Request, res: Response) => {
    try {
        const { todoId } = req.params;
        const { isCompleted } = req.body;

        if (!todoId || typeof isCompleted !== 'boolean') {
            return res.status(400).json(
                createResponse(null, 'Missing required fields: todoId, isCompleted')
            );
        }

        const todo = await database.updateTodo(todoId, { isCompleted });
        if (!todo) {
            return res.status(404).json(
                createResponse(null, 'Todo not found')
            );
        }

        res.json(createResponse(todo));

    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};

// Delete a reflection
export const deleteReflection = async (req: Request, res: Response) => {
    try {
        const { reflectionId } = req.params;

        if (!reflectionId) {
            return res.status(400).json(
                createResponse(null, 'Reflection ID is required')
            );
        }

        const deleted = await database.deleteReflection(reflectionId);
        if (!deleted) {
            return res.status(404).json(
                createResponse(null, 'Reflection not found')
            );
        }

        res.json(createResponse({ success: true, message: 'Reflection deleted successfully' }));

    } catch (error) {
        console.error('Error deleting reflection:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};

// Get user's todos
export const getUserTodos = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json(
                createResponse(null, 'User ID is required')
            );
        }

        const userTodos = await database.getUserTodos(userId);
        res.json(createResponse(userTodos));

    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};

// Get todos by reflection ID
export const getTodosByReflection = async (req: Request, res: Response) => {
    try {
        const { reflectionId } = req.params;

        if (!reflectionId) {
            return res.status(400).json(
                createResponse(null, 'Reflection ID is required')
            );
        }

        const todos = await database.getTodosByReflectionId(reflectionId);
        res.json(createResponse(todos));

    } catch (error) {
        console.error('Error fetching todos by reflection:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};

// Login/Register user by email
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(
                createResponse(null, 'Email is required')
            );
        }

        // Check if user exists (using email as ID for simplicity as requested)
        let user = await database.getUser(email);

        if (!user) {
            console.log(`New user login with email: ${email}, creating record...`);
            user = await database.createUser({
                id: email,
                preferences: {
                    feedbackStyle: 'encouraging',
                    moodTrackingEnabled: true,
                    summaryFrequency: 'daily'
                }
            } as any);
        }

        res.json(createResponse(user));

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json(
            createResponse(null, 'Internal server error')
        );
    }
};
// Get user summary (latest reflection, todos, keywords)
export const getUserSummary = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json(createResponse(null, 'User ID is required'));
        }

        const [latestReflection, history, allTodos, keywords] = await Promise.all([
            database.getLatestReflection(userId),
            database.getUserReflections(userId, 5),
            database.getUserTodos(userId),
            database.getUserKeywords(userId)
        ]);

        // Fetch todos for each history item to show intentions in the dashboard
        const historyWithTodos = await Promise.all(history.map(async (reflection) => {
            const reflectionTodos = await database.getTodosByReflectionId(reflection.id);
            return {
                ...reflection,
                suggestedTodos: reflectionTodos
            };
        }));

        let analysisData: any = null;
        if (latestReflection) {
            // Fetch todos specific to the latest reflection for the status warning
            const reflectionTodos = await database.getTodosByReflectionId(latestReflection.id);
            analysisData = {
                summary: latestReflection.summary,
                keywords: latestReflection.keywords,
                feedback: latestReflection.feedback,
                suggestedTodos: reflectionTodos
            };
        }

        res.json(createResponse({
            latestReflection,
            history: historyWithTodos,
            allTodos,
            keywords,
            analysisData
        }));

    } catch (error) {
        console.error('Error fetching user summary:', error);
        res.status(500).json(createResponse(null, 'Internal server error'));
    }
};
