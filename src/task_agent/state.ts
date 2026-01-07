import { Annotation } from '@langchain/langgraph';

// Define the state annotation
export const TaskStateAnnotation = Annotation.Root({
    messages: Annotation<any[]>({
        reducer: (x, y) => x.concat(y),
    }),
    userId: Annotation<string>({
        reducer: (x, y) => y ?? x,
    }),
    partialTask: Annotation<any>({
        reducer: (x, y) => ({ ...x, ...y }),
    }),
    missingFields: Annotation<any[]>({
        reducer: (x, y) => y ?? x,
    }),
    isConfirmationPending: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
    }),
    isComplete: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
    }),
    error: Annotation<string | undefined>({
        reducer: (x, y) => y ?? x,
    }),
    validationErrors: Annotation<string[] | undefined>({
        reducer: (x, y) => y ?? x,
    }),
    acknowledgement: Annotation<string | undefined>({
        reducer: (x, y) => y ?? x,
    }),
    lastCreatedTaskId: Annotation<string | undefined>({
        reducer: (x, y) => y ?? x,
    }),
    isWaitingForEmailChoice: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
    }),
});
