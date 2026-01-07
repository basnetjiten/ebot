import { AIMessage } from '@langchain/core/messages';
import { EmailAgentState } from './state';
import { EmailAgentTools } from './tools';
import { model } from '../utils/model';
import { EMAIL_SYSTEM_PROMPT } from './prompts';
import { SystemMessage } from '@langchain/core/messages';

export const analyzeIntentNode = async (state: typeof EmailAgentState.State) => {
    console.log('[EmailAgent] Analyzing intent...');

    // Check if account is already loaded
    let currentAccount = state.currentAccount;
    if (!currentAccount) {
        currentAccount = await EmailAgentTools.getAccount(state.userId);
    }

    const response = await model.invoke([
        new SystemMessage(EMAIL_SYSTEM_PROMPT + "\n\nAnalyze the last user message and return a JSON with 'operation' (setup|fetch|send|clarify) and any 'details' (to, subject, content)."),
        ...state.messages
    ]);

    let operation: any = 'clarify';
    let details: any = {};

    try {
        const cleaned = (response.content as string).replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        operation = parsed.operation;
        details = parsed.details || {};
    } catch (e) {
        console.error('Failed to parse intent:', e);
    }

    return {
        operation,
        currentAccount,
        pendingSend: operation === 'send' ? details : undefined,
    };
};

export const fetchEmailsNode = async (state: typeof EmailAgentState.State) => {
    let currentAccount = state.currentAccount;
    if (!currentAccount) {
        currentAccount = await EmailAgentTools.getAccount(state.userId);
    }

    if (!currentAccount) {
        return {
            messages: [new AIMessage('No email account connected. Please set up your email first.')],
            error: 'No account connected'
        };
    }

    console.log('[EmailAgent] Fetching 3 emails...');
    const emails = await EmailAgentTools.fetchEmails(currentAccount, 3);

    const emailList = emails.length > 0
        ? emails.map(e => `- From: ${e.from}\n  Subject: ${e.subject}\n  Content: ${e.content}`).join('\n\n')
        : "No recent emails found.";

    return {
        currentAccount,
        fetchedEmails: emails,
        messages: [new AIMessage(`I've found ${emails.length} recent emails for you:\n\n${emailList}`)]
    };
};

export const sendEmailNode = async (state: typeof EmailAgentState.State) => {
    if (!state.currentAccount) {
        return { error: 'No email account connected.' };
    }

    const details = state.pendingSend;
    if (!details || !details.to || !details.subject || !details.content) {
        return {
            messages: [new AIMessage("I'm ready to send that email, but I'm missing some details (recipient, subject, or content). Could you provide those?")]
        };
    }

    console.log('[EmailAgent] Sending email...');
    const success = await EmailAgentTools.sendEmail(
        state.currentAccount,
        details.to,
        details.subject,
        details.content
    );

    return {
        messages: [new AIMessage(success ? `Email sent successfully to ${details.to}!` : "I encountered an error while sending the email.")],
        pendingSend: undefined
    };
};

export const respondNode = (state: typeof EmailAgentState.State) => {
    if (state.error) {
        return { messages: [new AIMessage(state.error)], error: undefined };
    }
    return {};
};
