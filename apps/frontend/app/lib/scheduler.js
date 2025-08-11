// Scheduled task service for running periodic maintenance operations
import { checkServiceReminders } from '@/lib/alertService';

class SchedulerService {
  constructor() {
    this.intervals = new Map();
    this.isInitialized = false;
  }

  // Initialize the scheduler with default tasks
  init() {
    if (this.isInitialized) {
      console.log('[Scheduler] Already initialized');
      return;
    }

    console.log('[Scheduler] Initializing scheduled tasks...');
    
    // Schedule service reminders check every hour
    this.scheduleTask('serviceReminders', this.runServiceReminders.bind(this), 60 * 60 * 1000); // 1 hour
    
    // Schedule daily health check
    this.scheduleTask('healthCheck', this.runHealthCheck.bind(this), 24 * 60 * 60 * 1000); // 24 hours
    
    this.isInitialized = true;
    console.log('[Scheduler] Scheduled tasks initialized');
  }

  // Schedule a task with a specific interval
  scheduleTask(taskName, taskFunction, intervalMs) {
    // Clear existing interval if it exists
    if (this.intervals.has(taskName)) {
      clearInterval(this.intervals.get(taskName));
    }

    console.log(`[Scheduler] Scheduling task '${taskName}' to run every ${intervalMs / 1000} seconds`);
    
    // Run immediately
    taskFunction().catch(error => {
      console.error(`[Scheduler] Error in initial run of task '${taskName}':`, error);
    });
    
    // Schedule recurring execution
    const intervalId = setInterval(async () => {
      try {
        await taskFunction();
      } catch (error) {
        console.error(`[Scheduler] Error in scheduled task '${taskName}':`, error);
      }
    }, intervalMs);
    
    this.intervals.set(taskName, intervalId);
  }

  // Stop a scheduled task
  stopTask(taskName) {
    if (this.intervals.has(taskName)) {
      clearInterval(this.intervals.get(taskName));
      this.intervals.delete(taskName);
      console.log(`[Scheduler] Stopped task '${taskName}'`);
    }
  }

  // Stop all scheduled tasks
  stopAll() {
    console.log('[Scheduler] Stopping all scheduled tasks...');
    for (const [taskName, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`[Scheduler] Stopped task '${taskName}'`);
    }
    this.intervals.clear();
    this.isInitialized = false;
  }

  // Service reminders task
  async runServiceReminders() {
    try {
      console.log('[Scheduler] Running service reminders check...');
      const alertsCreated = await checkServiceReminders();
      console.log(`[Scheduler] Service reminders check completed. Created ${alertsCreated.length} alerts`);
      return { success: true, alertsCreated: alertsCreated.length };
    } catch (error) {
      console.error('[Scheduler] Service reminders check failed:', error);
      throw error;
    }
  }

  // Health check task
  async runHealthCheck() {
    try {
      console.log('[Scheduler] Running health check...');
      
      // Basic health checks
      const checks = {
        timestamp: new Date().toISOString(),
        scheduler: {
          active: this.isInitialized,
          runningTasks: Array.from(this.intervals.keys())
        }
      };
      
      console.log('[Scheduler] Health check completed:', checks);
      return checks;
    } catch (error) {
      console.error('[Scheduler] Health check failed:', error);
      throw error;
    }
  }

  // Get status of all scheduled tasks
  getStatus() {
    return {
      initialized: this.isInitialized,
      activeTasks: Array.from(this.intervals.keys()),
      taskCount: this.intervals.size
    };
  }
}

// Create singleton instance
const scheduler = new SchedulerService();

// Auto-initialize in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  // Initialize after a short delay to ensure everything is loaded
  setTimeout(() => {
    scheduler.init();
  }, 5000);
}

export default scheduler;

