

import { database } from './src/storage/database';
import { connectToDatabase } from './src/storage/connection';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

async function verifyDbName() {
    await connectToDatabase();
    const testId = `test-user-${uuidv4()}`;
    const firstName = 'TestName';

    console.log(`Creating user ${testId} with firstName ${firstName}...`);
    await database.createUser({
        id: testId,
        firstName: firstName,
        lastName: 'TestLast',
        preferences: { feedbackStyle: 'encouraging', moodTrackingEnabled: true, summaryFrequency: 'daily' }
    } as any);

    console.log('Retrieving user...');
    const user = await database.getUser(testId);

    console.log('Retrieved user:', user);

    if (user && user.firstName === firstName) {
        console.log('✅ SUCCESS: firstName retrieved correctly.');
    } else {
        console.log('❌ FAILURE: firstName NOT retrieved correctly.');
    }

    // Clean up if using mongo (optional, but good practice for tests)
    // await database.deleteUser(testId); // No deleteUser method exists in interface shown

    process.exit(0);
}

verifyDbName().catch(console.error);
