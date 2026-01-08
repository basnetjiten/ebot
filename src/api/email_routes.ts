import { Router } from 'express';
import { emailAgent } from '../email_agent';
import { database } from '../storage/database';
import { HumanMessage } from '@langchain/core/messages';
import { EmailService } from '../utils/email';

const router = Router();

// Get Google OAuth URL
router.get('/auth-url', (req, res) => {
    try {
        const { userId } = req.query;
        const url = EmailService.getAuthUrl(userId as string);
        res.json({ success: true, data: url });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Google OAuth Callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query; // 'state' can be used to pass userId back
    try {
        if (!code) throw new Error('No code provided');

        const tokens = await EmailService.getTokensFromCode(code as string);
        const email = await EmailService.getUserEmail(tokens);

        // state contains the userId passed in /auth-url
        // fallback to the actual email if state is missing (since user.id === email)
        const userId = (state as string) || email;

        const account = await database.addEmailAccount(userId, {
            email,
            provider: 'gmail',
            type: 'oauth2',
            oauth: tokens,
            isConnected: true,
        });

        // Redirect back to the app with success
        res.send(`
            <html>
                <script>
                    window.opener.postMessage({ type: 'GMAIL_CONNECTED', success: true }, '*');
                    window.close();
                </script>
                <body>
                    <h1>Connection Successful!</h1>
                    <p>You can close this window now.</p>
                </body>
            </html>
        `);
    } catch (error: any) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Get latest emails (top 3)
router.get('/latest/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const accounts = await database.getEmailAccounts(userId);
        const account = accounts.find((a) => a.provider === 'gmail' && a.isConnected);

        if (!account) {
            return res.json({ success: true, data: [] });
        }

        const emails = await EmailService.fetchEmails(account, 3);
        res.json({ success: true, data: emails });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Setup email account
router.post('/setup', async (req, res) => {
    try {
        const { userId, account } = req.body;
        if (!userId || !account) {
            return res.status(400).json({ success: false, error: 'Missing userId or account data' });
        }

        const newAccount = await database.addEmailAccount(userId, {
            ...account,
            isConnected: true,
        });

        res.json({ success: true, data: newAccount });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Chat with email agent
router.post('/chat', async (req, res) => {
    try {
        const { userId, message, history = [] } = req.body;

        const messages = [
            ...history.map((m: any) => m.sender === 'user' ? new HumanMessage(m.content) : new HumanMessage(m.content)), // Simple mapping for now
            new HumanMessage(message)
        ];

        const result = await emailAgent.invoke({
            messages,
            userId,
        });

        const lastMessage = result.messages[result.messages.length - 1];

        res.json({
            success: true,
            data: {
                content: lastMessage.content,
                operation: result.operation,
                fetchedEmails: result.fetchedEmails,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get connected accounts
router.get('/accounts/:userId', async (req, res) => {
    try {
        const accounts = await database.getEmailAccounts(req.params.userId);
        res.json({ success: true, data: accounts });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
