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

            // 1. Check if email reminder is needed
            if (task.remindViaEmail) {
                await this.sendEmailReminder(task);
            }

            // 2. Mark as completed
            await taskStore.updateTaskStatus(task.id, 'completed');
            console.log(`[TaskWorker] Task ${task.id} marked as completed.`);

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
