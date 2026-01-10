import { model } from './src/utils/model';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
    try {
        console.log('Testing Ollama connection...');
        console.log('Model configured:', (model as any).model);
        console.log('Base URL:', (model as any).baseUrl);

        const response = await model.invoke([
            new HumanMessage(
                'Hello, are you running locally? Reply with a short "Yes, I am working!".',
            ),
        ]);

        console.log('Response received:');
        console.log(response.content);
        console.log('Verification Success!');
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

main();
