import express from 'express';
import cors from 'cors';
import {
    submitReflection,
    getReflectionHistory,
    updateTodoStatus,
    getUserTodos
} from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/reflections', submitReflection);
app.get('/api/reflections/:userId', getReflectionHistory);
app.put('/api/todos/:todoId', updateTodoStatus);
app.get('/api/todos/:userId', getUserTodos);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Reflection Agent API',
        version: '1.0.0',
        description: 'LangGraph-based reflection analysis API for mobile apps',
        endpoints: {
            reflections: {
                'POST /api/reflections': 'Submit a reflection for analysis',
                'GET /api/reflections/:userId': 'Get user reflection history'
            },
            todos: {
                'PUT /api/todos/:todoId': 'Update todo status',
                'GET /api/todos/:userId': 'Get user todos'
            }
        }
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date()
    });
});

export const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Reflection Agent API server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`API docs: http://localhost:${PORT}/`);
    });
};

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}
