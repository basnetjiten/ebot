import { taskStore } from './src/storage/task_store';
import { TaskTools } from './src/task_agent/tools';
import { parseRequestNode, saveTaskNode } from './src/task_agent/nodes';
import { ObjectId } from 'mongodb';
import { TaskStateAnnotation } from './src/task_agent/state';
import { HumanMessage } from '@langchain/core/messages';
import { Task } from './src/types/task';

// Mock DB interactions for tools if needed, but we use real functional calls here
// Mock LLM response to simulate "Create task" then "Update task"
// Since we invoke TaskTools.extractTaskDetails which uses the real model,
// and the model is likely broken (API key issue mentioned in logs),
// we might need to MOCK TaskTools.extractTaskDetails?
// OR we assume the user fixed the key.
// Let's try to mock TaskTools.extractTaskDetails to be deterministic and safe without API key.

const originalExtract = TaskTools.extractTaskDetails;

const mockResponseSequence = [
    // 1. Create intent
    {
        type: 'todo',
        title: 'Buy Milk',
        data: {},
        missingFields: [],
        validationErrors: [],
    },
    // 2. Update intent (follow-up)
    {
        type: 'todo', // Might return same type
        title: 'Buy Milk', // Might return same title
        data: { remindViaEmail: true },
        missingFields: [],
        validationErrors: [],
        isUpdate: true, // The key flag!
    },
];

let callCount = 0;
TaskTools.extractTaskDetails = async (...args) => {
    console.log(`[MOCK] Extract called (call #${callCount})`);
    const resp = mockResponseSequence[callCount];
    callCount++;
    return resp as any;
};

// Also mock generateConfirmationPrompt to avoid LLM call
TaskTools.generateConfirmationPrompt = async () => 'Mock Confirmation: Ready to create Buy Milk?';

async function runTest() {
    console.log('Starting Update Flow Verification...');
    const userId = new ObjectId().toHexString();

    // --- STEP 1: CREATE TASK ---
    console.log('\n--- STEP 1: Creating Task "Buy Milk" ---');
    let state: any = {
        messages: [new HumanMessage('Buy Milk')],
        userId,
        partialTask: {},
        missingFields: [],
        isConfirmationPending: false,
        isComplete: false,
    };

    // 1. Parse
    let result = await parseRequestNode(state);
    state = { ...state, ...result };

    // 2. Simulate User Confirming
    console.log('User confirms...');
    state.messages.push(new HumanMessage('Yes'));
    state.isConfirmationPending = true; // Was pending from parse result (via confirmNode logic simulation)
    // Actually confirmTaskNode would run here.
    state.isComplete = true; // skipping confirmNode execution, assuming it returned isComplete: true

    // 3. Save
    const saveResult = await saveTaskNode(state);
    state = { ...state, ...saveResult };

    console.log('Task Saved. State keys:', Object.keys(saveResult));
    console.log('lastCreatedTaskId:', state.lastCreatedTaskId);

    if (!state.lastCreatedTaskId) {
        console.error('FAIL: lastCreatedTaskId is missing after save!');
        process.exit(1);
    }

    const taskId = state.lastCreatedTaskId;
    let task = (await taskStore.getTasks(userId)).find((t) => t.id === taskId);
    if (!task) {
        console.error('FAIL: Task not in DB');
        process.exit(1);
    }
    console.log('Task in DB:', {
        id: task.id,
        title: task.title,
        remindViaEmail: task.remindViaEmail,
    });

    // --- STEP 2: UPDATE TASK ---
    console.log('\n--- STEP 2: User says "Remind me via email" ---');
    // New turn, but state preserves lastCreatedTaskId
    state.messages.push(new HumanMessage('Remind me via email'));
    state.isComplete = false; // Reset for new turn
    state.isDone = false;

    // 4. Parse Request (should trigger update)
    result = await parseRequestNode(state);
    // state = { ...state, ...result }; // result has messages, isDone, etc.

    console.log('Parse Result:', result);

    if (!result.isDone) {
        console.error('FAIL: Should have completed the update and set isDone: true');
        process.exit(1);
    }

    // Verify DB update
    task = (await taskStore.getTasks(userId)).find((t) => t.id === taskId);
    console.log('Task in DB after update:', {
        id: task!.id,
        title: task!.title,
        remindViaEmail: task!.remindViaEmail,
    });

    if (task!.remindViaEmail !== true) {
        console.error('FAIL: remindViaEmail was not updated!');
        process.exit(1);
    }

    console.log('PASS: Task was updated successfully!');

    // Cleanup
    await taskStore.deleteTask(taskId);
}

runTest().catch(console.error);
