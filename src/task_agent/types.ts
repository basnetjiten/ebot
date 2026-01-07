import { TASK_SCHEMAS } from './schemas';

export interface ParsedTask {
    type: keyof typeof TASK_SCHEMAS;
    title: string;
    summary: string;
    data: Record<string, any>;
    missingFields: Array<{ field: string; reason: string; suggestedQuestion?: string }>;
    validationErrors?: string[];
}

export const generateMissingFieldQuestions = (missingFields: ParsedTask['missingFields']): string => {
    if (!missingFields || missingFields.length === 0) return '';

    return missingFields
        .map(field => field.suggestedQuestion || `What is the ${field.field}?`)
        .join('\n');
};
