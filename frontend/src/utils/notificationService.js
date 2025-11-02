// Notification Service for Browser Push Notifications
class NotificationService {
  constructor() {
    this.checkInterval = null;
    this.isRunning = false;
    this.lastChecked = {};
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Check if notifications are supported and permitted
  isSupported() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Send a notification
  sendNotification(title, options = {}) {
    if (!this.isSupported()) {
      console.warn('Notifications not available');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    return notification;
  }

  // Check if a reminder should be triggered now
  shouldTrigger(reminder) {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

    // Check if reminder is active
    if (!reminder.is_active) return false;

    // Check date range
    if (reminder.start_date > currentDate) return false;
    if (reminder.end_date && reminder.end_date < currentDate) return false;

    // Check if it's the right time (within the same minute)
    if (reminder.reminder_time !== currentTime) return false;

    // Check if it's the right day
    const days = Array.isArray(reminder.reminder_days) ? reminder.reminder_days : JSON.parse(reminder.reminder_days);
    if (!days.includes('daily') && !days.includes(currentDay)) return false;

    // Check if we already triggered this reminder in the last minute
    const reminderKey = `${reminder.id}-${currentDate}-${currentTime}`;
    if (this.lastChecked[reminderKey]) return false;

    // Mark as checked
    this.lastChecked[reminderKey] = true;

    return true;
  }

  // Get reminder notification details
  getReminderNotification(reminder) {
    const typeIcons = {
      medicine: '💊',
      appointment: '📅',
      checkup: '🩺',
      vaccination: '💉',
      exercise: '🏃',
      other: '📌'
    };

    const icon = typeIcons[reminder.reminder_type] || '🔔';
    let body = reminder.description || 'Time for your reminder';
    
    if (reminder.family_member_name) {
      body = `For ${reminder.family_member_name}: ${body}`;
    }

    return {
      title: `${icon} ${reminder.title}`,
      body,
      tag: `reminder-${reminder.id}`,
      data: { reminderId: reminder.id }
    };
  }

  // Check all active reminders and trigger notifications
  async checkReminders(apiClient) {
    if (!this.isSupported()) return;

    try {
      const response = await apiClient.get('/reminders/active');
      const reminders = response.data.reminders || [];

      for (const reminder of reminders) {
        if (this.shouldTrigger(reminder)) {
          const { title, body, tag, data } = this.getReminderNotification(reminder);
          
          const notification = this.sendNotification(title, { body, tag, data });
          
          // Mark as triggered in backend
          try {
            await apiClient.patch(`/reminders/${reminder.id}/triggered`);
          } catch (error) {
            console.error('Failed to update reminder trigger status:', error);
          }

          // Handle notification click
          if (notification) {
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }

          console.log(`🔔 Triggered reminder: ${title}`);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Start checking for reminders every minute
  start(apiClient) {
    if (this.isRunning) return;

    if (!this.isSupported()) {
      console.warn('Cannot start notification service: Notifications not available');
      return;
    }

    console.log('🔔 Notification service started');
    this.isRunning = true;

    // Check immediately
    this.checkReminders(apiClient);

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkReminders(apiClient);
    }, 60000); // 60 seconds

    // Clean up old lastChecked entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      for (const key in this.lastChecked) {
        if (this.lastChecked[key] < fiveMinutesAgo) {
          delete this.lastChecked[key];
        }
      }
    }, 5 * 60 * 1000);
  }

  // Stop checking for reminders
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.isRunning = false;
      console.log('🔕 Notification service stopped');
    }
  }
}

// Export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
