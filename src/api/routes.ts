import { Request, Response } from 'express';
import { compiledAgent } from '../agent';
import { ReflectionEntry, Todo, MobileAPIResponse } from '../types';
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
        const { userId, type, content, messages } = req.body;

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
        const { completed } = req.body;

        if (!todoId || typeof completed !== 'boolean') {
            return res.status(400).json(
                createResponse(null, 'Missing required fields: todoId, completed')
            );
        }

        const todo = await database.updateTodo(todoId, { completed });
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
