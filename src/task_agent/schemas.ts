export const TASK_SCHEMAS = {
    todo: {
        required: [],
        optional: ['priority', 'notes', 'dueDate', 'tags', 'subtasks'],
        schema: {
            priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
            notes: { type: 'string', maxLength: 1000 },
            dueDate: { type: 'iso8601', description: 'When task should be completed' },
            tags: { type: 'array', items: 'string', maxItems: 10 },
            subtasks: { type: 'array', items: { title: 'string', completed: 'boolean' } },
        },
    },
    event: {
        required: ['startTime', 'endTime'],
        optional: ['location', 'attendees', 'recurrence', 'reminders', 'videoLink'],
        schema: {
            startTime: { type: 'iso8601', required: true },
            endTime: { type: 'iso8601', required: true, validation: 'must be after startTime' },
            location: { type: 'string', maxLength: 200 },
            attendees: {
                type: 'array',
                items: {
                    name: 'string',
                    email: 'string?',
                    status: {
                        type: 'enum',
                        values: ['invited', 'accepted', 'declined', 'tentative'],
                    },
                },
            },
            recurrence: {
                type: 'object',
                pattern: { type: 'enum', values: ['daily', 'weekly', 'monthly', 'yearly'] },
                interval: { type: 'number', min: 1 },
                endDate: 'iso8601?',
            },
            reminders: {
                type: 'array',
                items: { type: 'enum', values: ['5min', '15min', '1hour', '1day'] },
            },
            videoLink: { type: 'url' },
        },
    },
    habit: {
        required: ['frequency'],
        optional: ['timeOfDay', 'targetStreak', 'reminderTime', 'trackingMetric'],
        schema: {
            frequency: { type: 'enum', values: ['daily', 'weekly', 'custom'], required: true },
            customFrequency: {
                type: 'object',
                condition: 'frequency === "custom"',
                daysOfWeek: {
                    type: 'array',
                    items: {
                        type: 'enum',
                        values: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                    },
                },
            },
            timeOfDay: { type: 'time', format: 'HH:MM' },
            targetStreak: {
                type: 'number',
                min: 1,
                description: 'Number of consecutive completions',
            },
            reminderTime: { type: 'time', format: 'HH:MM' },
            trackingMetric: {
                type: 'object',
                unit: 'string',
                target: 'number',
                description: 'e.g., {unit: "minutes", target: 30}',
            },
        },
    },
    reminder: {
        required: ['triggerTime'],
        optional: ['repeat', 'snoozeOptions', 'priority'],
        schema: {
            triggerTime: { type: 'iso8601', required: true },
            repeat: {
                type: 'object',
                pattern: { type: 'enum', values: ['none', 'daily', 'weekly', 'monthly'] },
                interval: { type: 'number', min: 1, default: 1 },
                endDate: 'iso8601?',
            },
            snoozeOptions: {
                type: 'array',
                items: { type: 'enum', values: ['5min', '10min', '30min', '1hour'] },
            },
            priority: { type: 'enum', values: ['low', 'medium', 'high', 'urgent'] },
            remindViaEmail: { type: 'boolean' },
        },
    },
    email: {
        required: ['to', 'subject', 'body'],
        optional: ['cc', 'bcc', 'attachments'],
        schema: {
            to: { type: 'string', pattern: 'email', required: true },
            subject: { type: 'string', maxLength: 200, required: true },
            body: { type: 'string', maxLength: 5000, required: true },
            cc: { type: 'array', items: 'string' },
            bcc: { type: 'array', items: 'string' },
            attachments: { type: 'array', items: 'string' },
        },
    },
} as const;

export const validateTaskData = (type: string, data: Record<string, any>): string[] => {
    const errors: string[] = [];
    const schema = TASK_SCHEMAS[type as keyof typeof TASK_SCHEMAS];

    if (!schema) return [`Invalid task type: ${type}`];

    // Check required fields
    for (const field of schema.required) {
        if (!(field in data)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate time ranges for events
    if (type === 'event' && data.startTime && data.endTime) {
        if (new Date(data.endTime) <= new Date(data.startTime)) {
            errors.push('Event end time must be after start time');
        }
    }

    return errors;
};
