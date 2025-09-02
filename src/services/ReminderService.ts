import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';

export interface MedicineReminder {
  id: string;
  familyMemberId: string;
  medicineName: string;
  timeOfDay: string; // Format: "HH:MM"
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentReminder {
  id: string;
  familyMemberId: string;
  doctorName: string;
  hospital: string;
  appointmentDateTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ReminderType = 'medicine' | 'appointment';

export class ReminderService {
  static async initializeNotifications(): Promise<void> {
    PushNotification.configure({
      onNotification: function(notification: any) {
        console.log('Notification received:', notification);
      },
      requestPermissions: true,
    });

    PushNotification.createChannel(
      {
        channelId: 'medilink-reminders',
        channelName: 'MediLink Reminders',
        channelDescription: 'Reminders for medicines and appointments',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created: boolean) => console.log(`Notification channel created: ${created}`)
    );
  }

  // Medicine Reminder Methods
  static async addMedicineReminder(reminder: Omit<MedicineReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicineReminder> {
    try {
      const newReminder: MedicineReminder = {
        ...reminder,
        id: `medicine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to storage
      const key = 'medicine_reminders';
      const stored = await AsyncStorage.getItem(key);
      const reminders = stored ? JSON.parse(stored) : [];
      reminders.push(newReminder);
      await AsyncStorage.setItem(key, JSON.stringify(reminders));

      // Schedule notifications
      await this.scheduleMedicineNotifications(newReminder);

      return newReminder;
    } catch (error) {
      console.error('Error adding medicine reminder:', error);
      throw error;
    }
  }

  static async getMedicineReminders(): Promise<MedicineReminder[]> {
    try {
      const stored = await AsyncStorage.getItem('medicine_reminders');
      if (!stored) return [];

      return JSON.parse(stored).map((reminder: any) => ({
        ...reminder,
        createdAt: new Date(reminder.createdAt),
        updatedAt: new Date(reminder.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting medicine reminders:', error);
      return [];
    }
  }

  static async updateMedicineReminder(reminderId: string, updates: Partial<MedicineReminder>): Promise<void> {
    try {
      const key = 'medicine_reminders';
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return;

      const reminders = JSON.parse(stored);
      const index = reminders.findIndex((r: MedicineReminder) => r.id === reminderId);
      if (index === -1) return;

      // Cancel existing notifications
      await this.cancelMedicineNotifications(reminders[index]);

      // Update reminder
      reminders[index] = { ...reminders[index], ...updates, updatedAt: new Date() };
      await AsyncStorage.setItem(key, JSON.stringify(reminders));

      // Reschedule if active
      if (reminders[index].isActive) {
        await this.scheduleMedicineNotifications(reminders[index]);
      }
    } catch (error) {
      console.error('Error updating medicine reminder:', error);
      throw error;
    }
  }

  static async deleteMedicineReminder(reminderId: string): Promise<void> {
    try {
      const key = 'medicine_reminders';
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return;

      const reminders = JSON.parse(stored);
      const reminder = reminders.find((r: MedicineReminder) => r.id === reminderId);
      
      if (reminder) {
        await this.cancelMedicineNotifications(reminder);
      }

      const updatedReminders = reminders.filter((r: MedicineReminder) => r.id !== reminderId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error deleting medicine reminder:', error);
      throw error;
    }
  }

  // Appointment Reminder Methods
  static async addAppointmentReminder(reminder: Omit<AppointmentReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppointmentReminder> {
    try {
      const newReminder: AppointmentReminder = {
        ...reminder,
        id: `appointment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to storage
      const key = 'appointment_reminders';
      const stored = await AsyncStorage.getItem(key);
      const reminders = stored ? JSON.parse(stored) : [];
      reminders.push(newReminder);
      await AsyncStorage.setItem(key, JSON.stringify(reminders));

      // Schedule notification (2 hours before)
      await this.scheduleAppointmentNotification(newReminder);

      return newReminder;
    } catch (error) {
      console.error('Error adding appointment reminder:', error);
      throw error;
    }
  }

  static async getAppointmentReminders(): Promise<AppointmentReminder[]> {
    try {
      const stored = await AsyncStorage.getItem('appointment_reminders');
      if (!stored) return [];

      return JSON.parse(stored).map((reminder: any) => ({
        ...reminder,
        appointmentDateTime: new Date(reminder.appointmentDateTime),
        createdAt: new Date(reminder.createdAt),
        updatedAt: new Date(reminder.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting appointment reminders:', error);
      return [];
    }
  }

  static async deleteAppointmentReminder(reminderId: string): Promise<void> {
    try {
      const key = 'appointment_reminders';
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return;

      const reminders = JSON.parse(stored);
      const reminder = reminders.find((r: AppointmentReminder) => r.id === reminderId);
      
      if (reminder) {
        PushNotification.cancelLocalNotification(reminder.id);
      }

      const updatedReminders = reminders.filter((r: AppointmentReminder) => r.id !== reminderId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error deleting appointment reminder:', error);
      throw error;
    }
  }

  // Notification Scheduling Methods
  private static async scheduleMedicineNotifications(reminder: MedicineReminder): Promise<void> {
    if (!reminder.isActive) return;

    const times = this.getMedicineNotificationTimes(reminder.timeOfDay, reminder.frequency);
    
    times.forEach((time, index) => {
      const notificationId = `${reminder.id}-${index}`;
      
      PushNotification.localNotificationSchedule({
        id: notificationId,
        channelId: 'medilink-reminders',
        title: '💊 Medicine Reminder',
        message: `Time to take ${reminder.medicineName}`,
        date: time,
        repeatType: 'day',
        actions: ['Mark as Taken', 'Snooze 15 min'],
      });
    });
  }

  private static async cancelMedicineNotifications(reminder: MedicineReminder): Promise<void> {
    const times = this.getMedicineNotificationTimes(reminder.timeOfDay, reminder.frequency);
    
    times.forEach((_, index) => {
      const notificationId = `${reminder.id}-${index}`;
      PushNotification.cancelLocalNotification(notificationId);
    });
  }

  private static getMedicineNotificationTimes(timeOfDay: string, frequency: string): Date[] {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const now = new Date();
    const times: Date[] = [];

    // Set base time for today
    const baseTime = new Date();
    baseTime.setHours(hours, minutes - 15, 0, 0); // 15 minutes before

    switch (frequency) {
      case 'daily':
        times.push(new Date(baseTime));
        break;
      case 'twice_daily':
        times.push(new Date(baseTime));
        const secondTime = new Date(baseTime);
        secondTime.setHours(secondTime.getHours() + 12);
        times.push(secondTime);
        break;
      case 'three_times_daily':
        times.push(new Date(baseTime));
        const secondTime2 = new Date(baseTime);
        secondTime2.setHours(secondTime2.getHours() + 8);
        times.push(secondTime2);
        const thirdTime = new Date(baseTime);
        thirdTime.setHours(thirdTime.getHours() + 16);
        times.push(thirdTime);
        break;
      case 'weekly':
        const weeklyTime = new Date(baseTime);
        weeklyTime.setDate(weeklyTime.getDate() + 7);
        times.push(weeklyTime);
        break;
    }

    // Ensure times are in the future
    return times.map(time => {
      if (time < now) {
        time.setDate(time.getDate() + 1);
      }
      return time;
    });
  }

  private static async scheduleAppointmentNotification(reminder: AppointmentReminder): Promise<void> {
    if (!reminder.isActive) return;

    const notificationTime = new Date(reminder.appointmentDateTime);
    notificationTime.setHours(notificationTime.getHours() - 2); // 2 hours before

    // Don't schedule if the time has already passed
    if (notificationTime < new Date()) return;

    PushNotification.localNotificationSchedule({
      id: reminder.id,
      channelId: 'medilink-reminders',
      title: '🏥 Appointment Reminder',
      message: `Appointment with Dr. ${reminder.doctorName} at ${reminder.hospital} in 2 hours`,
      date: notificationTime,
      actions: ['View Details', 'Reschedule'],
    });
  }

  // Utility Methods
  static async getRemindersByFamilyMember(familyMemberId: string): Promise<{
    medicines: MedicineReminder[];
    appointments: AppointmentReminder[];
  }> {
    try {
      const [medicines, appointments] = await Promise.all([
        this.getMedicineReminders(),
        this.getAppointmentReminders(),
      ]);

      return {
        medicines: medicines.filter(r => r.familyMemberId === familyMemberId),
        appointments: appointments.filter(r => r.familyMemberId === familyMemberId),
      };
    } catch (error) {
      console.error('Error getting reminders by family member:', error);
      return { medicines: [], appointments: [] };
    }
  }

  static async clearAllReminders(): Promise<void> {
    try {
      await AsyncStorage.removeItem('medicine_reminders');
      await AsyncStorage.removeItem('appointment_reminders');
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Error clearing all reminders:', error);
    }
  }
}
