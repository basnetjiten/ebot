import { generateFeedback } from './src/reflection_agent/tools';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
    try {
        console.log('Testing Feedback Generation...');
        const userContent = 'I want to focus on learning LangGraph today.';
        const feedback = await generateFeedback(userContent, 'morning', []);

        console.log('\n--- Generated Feedback ---');
        console.log(feedback);
        console.log('--------------------------\n');

        if (feedback.includes('[') && feedback.includes(']')) {
            console.warn('WARNING: Feedback may still contain brackets.');
        } else {
            console.log('SUCCESS: Feedback does not appear to contain brackets.');
        }
    } catch (error) {
        console.error('Verification Failed:', error);
    }
}

main();
