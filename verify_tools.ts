import { createTaskTool, extractTaskDetails } from './src/task_agent/tools';
import { analyzeKeyWords } from './src/reflection_agent/tools';
import { HumanMessage } from '@langchain/core/messages';
import { connectToDatabase, closeDatabase } from './src/storage/connection';

async function main() {
    console.log('Verifying Tools Refactor...');
    await connectToDatabase();

    // 1. Verify createTaskTool
    console.log('\n1. Testing createTaskTool...');
    try {
        const result = await createTaskTool.invoke({
            userId: 'test-user-123',
            title: 'Test Task from Script',
            type: 'todo',
            summary: 'A test task created via verification script',
            remindViaEmail: false,
            data: { priority: 'high' },
        });
        console.log('createTaskTool Result:', result);
        const parsed = JSON.parse(result);
        if (parsed.title === 'Test Task from Script') {
            console.log('✅ createTaskTool passed');
        } else {
            console.error('❌ createTaskTool failed: Unexpected title');
        }
    } catch (e) {
        console.error('❌ createTaskTool error:', e);
    }

    // 2. Verify extractTaskDetails (standalone function)
    console.log('\n2. Testing extractTaskDetails...');
    try {
        console.log('Testing simple input...');
        const result = await extractTaskDetails([new HumanMessage('Buy milk tomorrow at 5pm')], {});
        console.log('extractTaskDetails Result:', result);

        console.log('\nTesting tricky input (source of hallucinations)...');
        const trickyResult = await extractTaskDetails(
            [new HumanMessage('Remind me to call the dentist in 2 minutes today')],
            {},
        );
        console.log('Tricky Result:', trickyResult);

        if (result.title || result.type) {
            console.log('✅ extractTaskDetails passed');
        } else {
            console.log('⚠️  extractTaskDetails returned empty');
        }
    } catch (e) {
        console.error('❌ extractTaskDetails error:', e);
    }

    // 3. Verify analyzeKeyWords (reflection tool)
    console.log('\n3. Testing analyzeKeyWords...');
    try {
        const result = await analyzeKeyWords([
            new HumanMessage('I had a great day learning about AI.'),
        ]);
        console.log('analyzeKeyWords Result:', result);
        if (Array.isArray(result)) {
            console.log('✅ analyzeKeyWords passed');
        } else {
            console.error('❌ analyzeKeyWords failed: expected array');
        }
    } catch (e) {
        console.error('❌ analyzeKeyWords error:', e);
    }
    await closeDatabase();
}

main().catch(console.error);
