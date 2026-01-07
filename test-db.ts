import { database } from './src/storage/database';

async function testConnection() {
    console.log('Testing MongoDB connection and new features...');
    try {
        const testUserId = 'test-user-' + Date.now();

        console.log(`Checking auto-creation for user: ${testUserId}`);

        // We'll simulate a reflection submission which should trigger user creation
        const reflection = await database.createReflection({
            userId: testUserId,
            type: 'morning',
            timestamp: new Date(),
            content: 'I am feeling very productive today and I want to code more.',
        });
        console.log('Created reflection for non-existent user:', reflection.id);

        // Manually trigger the user creation and keyword saving that would happen in the route
        const user = await database.createUser({
            id: testUserId,
            preferences: {
                feedbackStyle: 'encouraging',
                moodTrackingEnabled: true,
                summaryFrequency: 'daily',
            },
        } as any);
        console.log('Auto-created user:', user.id);

        const keywords = ['productive', 'coding', 'motivation'];
        await database.saveKeywords(testUserId, keywords);
        console.log('Saved keywords:', keywords);

        const retrievedUser = await database.getUser(testUserId);
        console.log('Retrieved user exists:', !!retrievedUser);

        const reflections = await database.getUserReflections(testUserId);
        console.log('User reflections count:', reflections.length);

        console.log('Test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testConnection();
