import { EmailService } from '../utils/email';
import { database } from '../storage/database';
import { EmailAccount, EmailMessage } from '../types';

export class EmailAgentTools {
    static async getAccount(userId: string): Promise<EmailAccount | undefined> {
        const accounts = await database.getEmailAccounts(userId);
        return accounts[0]; // For now, just handle the first account
    }

    static async fetchEmails(account: EmailAccount, limit?: number): Promise<EmailMessage[]> {
        return await EmailService.fetchEmails(account, limit);
    }

    static async sendEmail(
        account: EmailAccount,
        to: string,
        subject: string,
        content: string,
    ): Promise<boolean> {
        return await EmailService.sendEmail(account, to, subject, content);
    }
}
