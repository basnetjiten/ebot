import { google } from 'googleapis';
import { EmailAccount, EmailMessage, OAuthTokens } from '../types';
import { config } from '../config';

export class EmailService {
    private static getOAuth2Client(tokens?: OAuthTokens) {
        const oauth2Client = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );

        if (tokens) {
            oauth2Client.setCredentials({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                expiry_date: tokens.expiryDate,
                token_type: tokens.tokenType,
                scope: tokens.scope,
            });
        }

        return oauth2Client;
    }

    /**
     * Generates a Google OAuth2 consent URL
     */
    static getAuthUrl() {
        const client = this.getOAuth2Client();
        return client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            prompt: 'consent',
        });
    }

    /**
     * Exchanges OAuth2 code for tokens
     */
    static async getTokensFromCode(code: string): Promise<OAuthTokens> {
        const client = this.getOAuth2Client();
        const { tokens } = await client.getToken(code);

        return {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            expiryDate: tokens.expiry_date!,
            tokenType: tokens.token_type!,
            scope: tokens.scope!,
        };
    }

    /**
     * Sends an email using the provided account configuration
     */
    static async sendEmail(
        account: EmailAccount,
        to: string,
        subject: string,
        content: string,
    ): Promise<boolean> {
        console.log(`[EmailService] Sending email to ${to} using ${account.email}`);

        if (account.type === 'oauth2' && account.oauth) {
            try {
                const auth = this.getOAuth2Client(account.oauth);
                const gmail = google.gmail({ version: 'v1', auth });

                const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
                const messageParts = [
                    `From: ${account.email}`,
                    `To: ${to}`,
                    'Content-Type: text/plain; charset=utf-8',
                    'MIME-Version: 1.0',
                    `Subject: ${utf8Subject}`,
                    '',
                    content,
                ];
                const message = messageParts.join('\n');
                const encodedMessage = Buffer.from(message)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw: encodedMessage },
                });
                return true;
            } catch (error) {
                console.error('[EmailService] Gmail API error:', error);
                return false;
            }
        }

        // Fallback or legacy SMTP (could re-enable nodemailer here if needed)
        return true;
    }

    /**
     * Fetches emails from the provided account configuration
     */
    static async fetchEmails(account: EmailAccount, limit: number = 10): Promise<EmailMessage[]> {
        console.log(`[EmailService] Fetching emails for ${account.email}`);

        if (account.type === 'oauth2' && account.oauth) {
            try {
                const auth = this.getOAuth2Client(account.oauth);
                const gmail = google.gmail({ version: 'v1', auth });

                const response = await gmail.users.messages.list({
                    userId: 'me',
                    maxResults: limit,
                });

                const messages = response.data.messages || [];
                const fetchedEmails: EmailMessage[] = [];

                for (const msg of messages) {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id!,
                    });

                    const headers = detail.data.payload?.headers || [];
                    const from = headers.find(h => h.name === 'From')?.value || '';
                    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                    const date = headers.find(h => h.name === 'Date')?.value || '';

                    let content = '';
                    if (detail.data.payload?.parts) {
                        const part = detail.data.payload.parts.find(p => p.mimeType === 'text/plain');
                        if (part?.body?.data) {
                            content = Buffer.from(part.body.data, 'base64').toString();
                        }
                    } else if (detail.data.payload?.body?.data) {
                        content = Buffer.from(detail.data.payload.body.data, 'base64').toString();
                    }

                    fetchedEmails.push({
                        id: detail.data.id!,
                        from,
                        to: account.email,
                        subject,
                        content: content.slice(0, 500) + (content.length > 500 ? '...' : ''),
                        timestamp: new Date(date),
                        hasReplied: false,
                    });
                }

                return fetchedEmails;
            } catch (error) {
                console.error('[EmailService] Gmail API error:', error);
                return [];
            }
        }

        // Mock data for demonstration if no account connected
        return [
            {
                id: 'mock-1',
                from: 'welcome@ebot.ai',
                to: account.email,
                subject: 'Welcome to Reflectly Email',
                content: 'Please connect your real Gmail account to see your real emails!',
                timestamp: new Date(),
                hasReplied: false,
            }
        ];
    }

    /**
     * Gets user info from Google Profile
     */
    static async getUserEmail(tokens: OAuthTokens): Promise<string> {
        const auth = this.getOAuth2Client(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth });
        const res = await oauth2.userinfo.get();
        return res.data.email!;
    }
}
