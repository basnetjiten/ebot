import express from 'express';
import cors from 'cors';
import { config } from '../config';
import {
    submitReflection,
    getReflectionHistory,
    updateTodoStatus,
    deleteReflection,
    getUserTodos,
    getTodosByReflection,
    loginUser,
    getUserSummary,
} from './routes';
import taskRoutes from './task_routes';
import emailRoutes from './email_routes';
import { taskWorker } from '../task_agent/worker';

const app = express();
// const PORT = config.port; // Removed as per instruction

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/reflections', submitReflection);
app.get('/api/users/:userId/reflections', getReflectionHistory); // Changed path
app.delete('/api/reflections/:reflectionId', deleteReflection);

app.get('/api/users/:userId/todos', getUserTodos); // Changed path
app.get('/api/reflections/:reflectionId/todos', getTodosByReflection);
app.put('/api/todos/:todoId', updateTodoStatus);

app.post('/api/auth/login', loginUser); // Changed path
app.get('/api/users/:userId/summary', getUserSummary);

// Task Routes
app.use('/api/tasks', taskRoutes);

// Email Routes
app.use('/api/email', emailRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date(),
    });
});

export const startServer = () => {
    app.listen(config.port, () => {
        console.log(`Reflection Agent API server running on port ${config.port}`);
        console.log(`Health check: http://localhost:${config.port}/health`);
        console.log(`API docs: http://localhost:${config.port}/`);

        // Start background worker
        taskWorker.start();
    });
};

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}
