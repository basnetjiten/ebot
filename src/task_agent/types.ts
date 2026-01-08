import { z } from 'zod';
import { TaskExtractionSchema } from './zod_schemas';

export type ParsedTask = z.infer<typeof TaskExtractionSchema>;

export const generateMissingFieldQuestions = (
    missingFields: ParsedTask['missingFields'],
): string => {
    if (!missingFields || missingFields.length === 0) return '';

    return missingFields
        .map((field) => field.suggestedQuestion || `What is the ${field.field}?`)
        .join('\n');
};
