import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Avatar,
  Chip,
  Switch,
  IconButton,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { ReminderService, MedicineReminder, AppointmentReminder } from '../../services/ReminderService';
import { useFamily } from '../../contexts/FamilyContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type RemindersScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface RemindersScreenProps {
  navigation: RemindersScreenNavigationProp;
}

const RemindersScreen: React.FC<RemindersScreenProps> = ({ navigation }) => {
  const [medicineReminders, setMedicineReminders] = useState<MedicineReminder[]>([]);
  const [appointmentReminders, setAppointmentReminders] = useState<AppointmentReminder[]>([]);
  const [activeTab, setActiveTab] = useState<'medicines' | 'appointments'>('medicines');
  const [refreshing, setRefreshing] = useState(false);

  const { members } = useFamily();

  useEffect(() => {
    ReminderService.initializeNotifications();
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const [medicines, appointments] = await Promise.all([
        ReminderService.getMedicineReminders(),
        ReminderService.getAppointmentReminders(),
      ]);
      setMedicineReminders(medicines);
      setAppointmentReminders(appointments);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleToggleMedicineReminder = async (reminderId: string, isActive: boolean) => {
    try {
      await ReminderService.updateMedicineReminder(reminderId, { isActive });
      await loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const handleDeleteMedicineReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this medicine reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReminderService.deleteMedicineReminder(reminderId);
              await loadReminders();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAppointmentReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this appointment reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReminderService.deleteAppointmentReminder(reminderId);
              await loadReminders();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'twice_daily': return 'Twice Daily';
      case 'three_times_daily': return '3 Times Daily';
      case 'weekly': return 'Weekly';
      default: return frequency;
    }
  };

  const getMemberName = (memberId: string): string => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown Member';
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointmentReminders
      .filter(reminder => reminder.appointmentDateTime > now && reminder.isActive)
      .sort((a, b) => a.appointmentDateTime.getTime() - b.appointmentDateTime.getTime());
  };

  const getPastAppointments = () => {
    const now = new Date();
    return appointmentReminders
      .filter(reminder => reminder.appointmentDateTime <= now)
      .sort((a, b) => b.appointmentDateTime.getTime() - a.appointmentDateTime.getTime());
  };

  const renderMedicineReminder = (reminder: MedicineReminder) => (
    <Card key={reminder.id} style={styles.reminderCard}>
      <Card.Content>
        <View style={styles.reminderHeader}>
          <Avatar.Icon size={40} icon="pill" style={styles.medicineIcon} />
          <View style={styles.reminderInfo}>
            <Text variant="titleMedium" style={styles.reminderTitle}>
              {reminder.medicineName}
            </Text>
            <Text variant="bodySmall" style={styles.memberName}>
              {getMemberName(reminder.familyMemberId)}
            </Text>
            <View style={styles.reminderDetails}>
              <Chip icon="clock" style={styles.detailChip}>
                {reminder.timeOfDay}
              </Chip>
              <Chip icon="repeat" style={styles.detailChip}>
                {getFrequencyLabel(reminder.frequency)}
              </Chip>
            </View>
          </View>
          <View style={styles.reminderActions}>
            <Switch
              value={reminder.isActive}
              onValueChange={(value) => handleToggleMedicineReminder(reminder.id, value)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteMedicineReminder(reminder.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAppointmentReminder = (reminder: AppointmentReminder, isPast: boolean = false) => (
    <Card key={reminder.id} style={[styles.reminderCard, isPast && styles.pastReminder]}>
      <Card.Content>
        <View style={styles.reminderHeader}>
          <Avatar.Icon size={40} icon="calendar-clock" style={styles.appointmentIcon} />
          <View style={styles.reminderInfo}>
            <Text variant="titleMedium" style={styles.reminderTitle}>
              Dr. {reminder.doctorName}
            </Text>
            <Text variant="bodyMedium" style={styles.hospitalName}>
              {reminder.hospital}
            </Text>
            <Text variant="bodySmall" style={styles.memberName}>
              {getMemberName(reminder.familyMemberId)}
            </Text>
            <View style={styles.reminderDetails}>
              <Chip icon="calendar" style={styles.detailChip}>
                {reminder.appointmentDateTime.toLocaleDateString()}
              </Chip>
              <Chip icon="clock" style={styles.detailChip}>
                {reminder.appointmentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Chip>
              {isPast && (
                <Chip icon="check" style={[styles.detailChip, styles.pastChip]}>
                  Completed
                </Chip>
              )}
            </View>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDeleteAppointmentReminder(reminder.id)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              ⏰ Reminders & Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Manage medicine and appointment reminders for your family
            </Text>
          </Card.Content>
        </Card>

        {/* Tab Selection */}
        <Card style={styles.tabCard}>
          <Card.Content>
            <View style={styles.tabContainer}>
              <Button
                mode={activeTab === 'medicines' ? 'contained' : 'outlined'}
                onPress={() => setActiveTab('medicines')}
                style={styles.tabButton}
                icon="pill"
              >
                Medicines ({medicineReminders.length})
              </Button>
              <Button
                mode={activeTab === 'appointments' ? 'contained' : 'outlined'}
                onPress={() => setActiveTab('appointments')}
                style={styles.tabButton}
                icon="calendar-clock"
              >
                Appointments ({appointmentReminders.length})
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Medicine Reminders Tab */}
        {activeTab === 'medicines' && (
          <>
            {medicineReminders.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyState}>
                  <Avatar.Icon size={80} icon="pill" style={styles.emptyIcon} />
                  <Text variant="headlineSmall" style={styles.emptyTitle}>
                    No Medicine Reminders
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Set up reminders to never miss your medications. Get notifications at the right time.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  💊 Medicine Reminders
                </Text>
                {medicineReminders.map(renderMedicineReminder)}
              </>
            )}
          </>
        )}

        {/* Appointment Reminders Tab */}
        {activeTab === 'appointments' && (
          <>
            {appointmentReminders.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyState}>
                  <Avatar.Icon size={80} icon="calendar-clock" style={styles.emptyIcon} />
                  <Text variant="headlineSmall" style={styles.emptyTitle}>
                    No Appointment Reminders
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Schedule appointment reminders to get notified 2 hours before your doctor visits.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <>
                {/* Upcoming Appointments */}
                {getUpcomingAppointments().length > 0 && (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      📅 Upcoming Appointments
                    </Text>
                    {getUpcomingAppointments().map(reminder => renderAppointmentReminder(reminder))}
                  </>
                )}

                {/* Past Appointments */}
                {getPastAppointments().length > 0 && (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      📋 Past Appointments
                    </Text>
                    {getPastAppointments().map(reminder => renderAppointmentReminder(reminder, true))}
                  </>
                )}
              </>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          Alert.alert(
            'Add Reminder',
            'What type of reminder would you like to add?',
            [
              {
                text: 'Medicine',
                onPress: () => navigation.navigate('AddMedicineReminder' as any),
              },
              {
                text: 'Appointment',
                onPress: () => navigation.navigate('AddAppointmentReminder' as any),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
        label="Add Reminder"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  tabCard: {
    margin: 16,
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tabButton: {
    flex: 1,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginVertical: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  reminderCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  pastReminder: {
    opacity: 0.7,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medicineIcon: {
    backgroundColor: '#E8F5E8',
  },
  appointmentIcon: {
    backgroundColor: '#E3F2FD',
  },
  reminderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hospitalName: {
    color: '#666',
    marginBottom: 4,
  },
  memberName: {
    color: '#666',
    marginBottom: 8,
  },
  reminderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  pastChip: {
    backgroundColor: '#E8F5E8',
  },
  reminderActions: {
    alignItems: 'center',
    gap: 8,
  },
  emptyCard: {
    margin: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    backgroundColor: '#E3F2FD',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  bottomPadding: {
    height: 100,
  },
});

export default RemindersScreen;
