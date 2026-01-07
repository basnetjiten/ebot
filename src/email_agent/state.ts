import { Annotation } from '@langchain/langgraph';
import { EmailAccount, EmailMessage } from '../types';

export const EmailAgentState = Annotation.Root({
    messages: Annotation<any[]>({
        reducer: (x, y) => x.concat(y),
    }),
    userId: Annotation<string>({
        reducer: (x, y) => y ?? x,
    }),
    currentAccount: Annotation<EmailAccount | undefined>({
        reducer: (x, y) => y ?? x,
    }),
    fetchedEmails: Annotation<EmailMessage[]>({
        reducer: (x, y) => y ?? x,
    }),
    operation: Annotation<'none' | 'setup' | 'fetch' | 'send' | 'clarify'>({
        reducer: (x, y) => y ?? x,
    }),
    pendingSend: Annotation<{ to: string; subject: string; content: string } | undefined>({
        reducer: (x, y) => y ?? x,
    }),
    error: Annotation<string | undefined>({
        reducer: (x, y) => y ?? x,
    }),
});
