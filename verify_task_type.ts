import { extractTaskDetails } from './src/task_agent/tools';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
    console.log('Testing Task Classification...');

    const testCases = [
        {
            input: 'Remind me to call Mom at 6pm',
            expectedType: 'reminder',
        },
        {
            input: 'Schedule a team meeting for tomorrow at 10am',
            expectedType: 'event',
        },
        {
            input: 'I want to start running every morning',
            expectedType: 'habit',
        },
        {
            input: 'Buy groceries',
            expectedType: 'todo',
        },
    ];

    for (const test of testCases) {
        console.log(`\nInput: "${test.input}"`);
        try {
            const result = await extractTaskDetails([new HumanMessage(test.input)], {});
            console.log('Full Result:', JSON.stringify(result, null, 2));
            console.log(`Classified as: ${result?.type}`);

            if (result.type === test.expectedType) {
                console.log('✅ PASS');
            } else {
                console.log(`❌ FAIL (Expected: ${test.expectedType})`);
            }
        } catch (error) {
            console.error('Error during extraction:', error);
        }
    }
}

main();
