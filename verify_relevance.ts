
import { generateFeedback } from './src/reflection_agent/tools';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

async function main() {
    console.log('Testing Reflection Context Relevance...');

    // Scenario 1: Relevant Follow-up
    console.log('\n--- Scenario 1: Relevant Follow-up ---');
    const original = "I want to focus on coding today.";
    const followUp = "I just finished the first module.";

    // Simulate history
    const history1 = [
        new HumanMessage(original),
        new AIMessage("That's great! Coding requires Focus."),
        new HumanMessage(followUp)
    ];

    const response1 = await generateFeedback(followUp, 'morning', history1);
    console.log(`Original: "${original}"`);
    console.log(`Latest: "${followUp}"`);
    console.log(`AI Response:\n${response1}\n`);

    // Scenario 2: Off-topic Drift
    console.log('\n--- Scenario 2: Off-topic Drift ---');
    const offTopic = "Who won the World Cup in 1998?";

    const history2 = [
        new HumanMessage(original),
        new AIMessage("That's great! Coding requires Focus."),
        new HumanMessage(offTopic)
    ];

    const response2 = await generateFeedback(offTopic, 'morning', history2);
    console.log(`Original: "${original}"`);
    console.log(`Latest: "${offTopic}"`);
    console.log(`AI Response (Should redirect):\n${response2}\n`);
}

main();
