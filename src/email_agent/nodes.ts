import { AIMessage } from '@langchain/core/messages';
import { EmailAgentState } from './state';
import { EmailAgentTools } from './tools';

export const fetchEmailsNode = async (state: typeof EmailAgentState.State) => {
    let currentAccount = state.currentAccount;
    if (!currentAccount) {
        currentAccount = await EmailAgentTools.getAccount(state.userId);
    }

    if (!currentAccount) {
        return {
            messages: [
                new AIMessage('No email account connected. Please set up your email first.'),
            ],
            error: 'No account connected',
        };
    }

    console.log('[EmailAgent] Fetching 3 emails...');
    const emails = await EmailAgentTools.fetchEmails(currentAccount, 3);

    const emailList =
        emails.length > 0
            ? emails
                .map((e) => `- From: ${e.from}\n  Subject: ${e.subject}\n  Content: ${e.content}`)
                .join('\n\n')
            : 'No recent emails found.';

    return {
        currentAccount,
        fetchedEmails: emails,
        messages: [
            new AIMessage(`I've found ${emails.length} recent emails for you:\n\n${emailList}`),
        ],
    };
};

export const sendEmailNode = async (state: typeof EmailAgentState.State) => {
    if (!state.currentAccount) {
        return { error: 'No email account connected.' };
    }

    const details = state.pendingSend;
    if (!details || !details.to || !details.subject || !details.content) {
        return {
            messages: [
                new AIMessage(
                    "I'm ready to send that email, but I'm missing some details (recipient, subject, or content). Could you provide those?",
                ),
            ],
        };
    }

    console.log('[EmailAgent] Sending email...');
    const success = await EmailAgentTools.sendEmail(
        state.currentAccount,
        details.to,
        details.subject,
        details.content,
    );

    return {
        messages: [
            new AIMessage(
                success
                    ? `Email sent successfully to ${details.to}!`
                    : 'I encountered an error while sending the email.',
            ),
        ],
        pendingSend: undefined,
    };
};

export const respondNode = (state: typeof EmailAgentState.State) => {
    if (state.error) {
        return { messages: [new AIMessage(state.error)], error: undefined };
    }
    return {};
};
