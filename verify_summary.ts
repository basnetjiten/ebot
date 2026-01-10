
import { generateSummary } from './src/reflection_agent/tools';
import { HumanMessage } from '@langchain/core/messages';
import { config } from './src/config';

// Mock the model response since we can't easily force the LLM to output specific JSON without sending a request.
// However, since we are testing the tool's parsing logic (and the prompt instruction), 
// effectively we want to see if `generateSummary` returns an object.
// But `generateSummary` calls `model.invoke`.
// We can run it against the real model and see if it adheres to the JSON schema in the new prompt.

async function main() {
    console.log('Testing Structured Summary Generation...');

    const history = [
        new HumanMessage("I'm feeling really productive today. I finished all my tasks early."),
        new HumanMessage("I want to keep this momentum going for the rest of the week.")
    ];

    try {
        console.log('Invoking generateSummary...');
        const result = await generateSummary(history);

        console.log('\n--- Result ---');
        console.log('Title:', result.title);
        console.log('Summary:', result.summary);

        if (result.title && result.summary && result.title !== 'Reflection') {
            console.log('\n✅ PASS: Received structured output with title.');
        } else {
            console.log('\n⚠️  WARNING: Title might be default or missing via JSON parsing.');
            console.log('Full structure:', JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

main();
