import { Router } from 'express';
import { taskAgent } from '../task_agent';
import { taskStore } from '../storage/task_store';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

const router = Router();

// Chat endpoint for task creation
router.post('/chat', async (req, res) => {
    try {
        const { userId, message, history, previousState } = req.body;

        const config = { configurable: { thread_id: userId } };

        // Reconstruct message history
        const messageHistory = (history || []).map((msg: any) => {
            if (msg.sender === 'user') return new HumanMessage(msg.content);
            return new AIMessage(msg.content);
        });

        // Add the new message
        const currentMessages = [...messageHistory, new HumanMessage(message)];

        const inputs = {
            messages: currentMessages,
            userId: userId,
            // If the client sends back the gathered partialTask, we use it
            partialTask: previousState?.partialTask || {},
            missingFields: previousState?.missingFields || [],
            isConfirmationPending: previousState?.isConfirmationPending || false,
        };

        const result = await taskAgent.invoke(inputs, config);

        // Get the last message from agent
        const agentResponse = result.messages[result.messages.length - 1];

        res.json({
            success: true,
            message: agentResponse.content,
            state: {
                partialTask: result.partialTask,
                missingFields: result.missingFields,
                isConfirmationPending: result.isConfirmationPending,
                isComplete: result.isComplete,
            },
        });
    } catch (error) {
        console.error('Task Chat Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get tasks
router.get('/:userId', async (req, res) => {
    try {
        const tasks = await taskStore.getTasks(req.params.userId);
        res.json({ success: true, data: tasks });
    } catch (_error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
});

// Update status
router.put('/:taskId/status', async (req, res) => {
    try {
        const result = await taskStore.updateTaskStatus(req.params.taskId, req.body.status);
        res.json({ success: true, data: result });
    } catch (_error) {
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:taskId', async (req, res) => {
    try {
        const result = await taskStore.deleteTask(req.params.taskId);
        res.json({ success: true, data: result });
    } catch (_error) {
        res.status(500).json({ success: false, error: 'Failed to delete task' });
    }
});

export default router;
