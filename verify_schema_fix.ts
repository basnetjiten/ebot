import { createTaskTool } from './src/task_agent/tools';

async function main() {
    console.log('Testing createTaskTool with object-wrapped boolean...');

    // Simulate the bad input the tool was rejecting
    // But wait, the tool call is what failed.
    // The previous code in nodes.ts was passing the object to the tool.
    // My fix in nodes.ts un-wraps it *before* calling the tool.
    // So to verify, I should check if the logic I added works?
    // I can't easily run the node isolated without state, but I can verify the sanitization logic itself
    // or just rely on the fact that I changed the input to the tool.

    // Instead, let's verify that the TOOL itself accepts a boolean, and rejects an object,
    // confirming my diagnosis that the sanitization was needed.

    try {
        console.log('Attempting to call tool with boolean (Success case)...');
        await createTaskTool.invoke({
            userId: 'test-user',
            title: 'Test Task',
            type: 'todo',
            remindViaEmail: true,
        });
        console.log('Success: Tool accepted boolean.');
    } catch (e) {
        console.error('Unexpected error with boolean:', e);
    }

    try {
        console.log('Attempting to call tool with object (Failure case)...');
        await createTaskTool.invoke({
            userId: 'test-user',
            title: 'Test Task',
            type: 'todo',
            remindViaEmail: { value: true } as any,
        });
        console.error('Error: Tool accepted object! (It should have failed)');
    } catch (e) {
        console.log('Success: Tool rejected object as expected.');
        console.log('Error message:', e.message);
    }
}

main();
