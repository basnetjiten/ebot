import { taskStore } from '../storage/task_store';
import { EmailService } from '../utils/email';
import { database } from '../storage/database';
import { Task } from '../types/task';

export class TaskWorker {
    private interval: NodeJS.Timeout | null = null;
    private isProcessing = false;

    constructor(private pollIntervalMs: number = 60000) { } // Default to 1 minute

    start() {
        if (this.interval) return;

        console.log(`[TaskWorker] Starting background worker (poll interval: ${this.pollIntervalMs}ms)...`);
        this.interval = setInterval(() => this.processTasks(), this.pollIntervalMs);

        // Run immediately on start
        this.processTasks();
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private async processTasks() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const dueTasks = await taskStore.getDueTasks();
            console.log(`[TaskWorker] Polling... Found ${dueTasks.length} due tasks to process.`);

            if (dueTasks.length > 0) {
                for (const task of dueTasks) {
                    console.log(`[TaskWorker] Task details:`, {
                        id: task.id,
                        title: task.title,
                        type: task.type,
                        status: task.status,
                        remindViaEmail: task.remindViaEmail,
                        triggerTime: (task.data as any)?.triggerTime,
                        startTime: (task.data as any)?.startTime,
                    });
                    await this.processSingleTask(task);
                }
            }
        } catch (error) {
            console.error('[TaskWorker] Error processing due tasks:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processSingleTask(task: Task) {
        try {
            console.log(`[TaskWorker] Processing task: ${task.title} (${task.id})`);

            // 1. Check if it's a dedicated reminder task
            if (task.type === 'reminder') {
                if (task.remindViaEmail) {
                    await this.sendEmailReminder(task);
                }
                // Mark as completed
                await taskStore.updateTaskStatus(task.id, 'completed');
                console.log(`[TaskWorker] Reminder task ${task.id} marked as completed.`);
                return;
            }

            // 2. Handling for other tasks (Todo, Event, etc.) with reminders
            if (task.remindViaEmail) {
                // Check if reminder is due
                const reminderTime = (task.data as any)?.reminderTime;
                const now = new Date().toISOString();

                if (reminderTime && reminderTime <= now) {
                    await this.sendEmailReminder(task);

                    // Mark reminder as sent, but keep task pending
                    await taskStore.updateTask(task.id, {
                        data: { ...task.data, reminderSent: true }
                    } as any);
                    console.log(`[TaskWorker] Sent reminder for task ${task.id}, marked reminderSent=true.`);
                }
            }

            // 3. (Optional) Existing logic for events to mark them 'completed' or 'in_progress' could go here,
            // but for now we only wanted to fix the reminder behavior.
            // If it was an event that started, maybe we leave it as pending or move to in_progress?
            // The original code marked EVERYTHING as completed if it was picked up.
            // For stability, let's keep original behavior for Events (start time passed -> completed? Or just stay pending?)
            // The user request was about "email reminders".
            // Let's assume if it's an Event and start time marked it picked up, maybe we shouldn't complete it instantly?
            // But to be safe and stick to scope: I will only modify the Reminder logic.
            // If it was picked up because of start time (and not reminder time), we might still want to complete it?

            // Re-evaluating: The query picks up Events if startTime <= now. 
            // If we don't complete them, they will be picked up forever in the loop.
            // So if it was picked up by startTime (and not reminder), we should probably complete it or flag it.

            if (task.type === 'event' && (task.data as any).startTime <= new Date().toISOString()) {
                // For now, let's auto-complete events that have "started" to prevent infinite loop,
                // or maybe we should have an 'in_progress' state?
                // Let's stick to 'completed' to match previous behavior for events.
                await taskStore.updateTaskStatus(task.id, 'completed');
                console.log(`[TaskWorker] Event task ${task.id} marked as completed (started).`);
            }

        } catch (error) {
            console.error(`[TaskWorker] Failed to process task ${task.id}:`, error);
        }
    }

    private async sendEmailReminder(task: Task) {
        try {
            const user = await database.getUser(task.userId);
            const account = user?.emailAccounts?.find(a => a.isConnected);

            if (!account) {
                console.warn(
                    `[TaskWorker] No connected email account found for user ${task.userId}, skipping email reminder.`
                );
                return;
            }

            const subject = `Task Reminder: ${task.title}`;

            const scheduledTime =
                (task.data as any)?.triggerTime ||
                (task.data as any)?.startTime ||
                'Now';

            const body = `Hello,

This is a reminder regarding your scheduled task. Please find the details below:

Task Title:
${task.title}

Summary:
${task.summary || 'N/A'}

Scheduled Time:
${scheduledTime}

If you have already completed this task, please feel free to disregard this message.

Best regards,
Your Task Assistant`;

            const success = await EmailService.sendEmail(
                account,
                account.email,
                subject,
                body
            );

            if (success) {
                console.log(
                    `[TaskWorker] Email reminder sent successfully for task ${task.id}.`
                );
            } else {
                console.error(
                    `[TaskWorker] Failed to send email reminder for task ${task.id}.`
                );
            }
        } catch (error) {
            console.error(
                `[TaskWorker] Error sending email reminder for task ${task.id}:`,
                error
            );
        }
    }

}

export const taskWorker = new TaskWorker();
