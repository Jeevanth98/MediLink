import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  List,
  Divider,
  Menu,
  TouchableRipple,
  Avatar,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ReminderService } from '../../services/ReminderService';
import { useFamily } from '../../contexts/FamilyContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AddAppointmentReminderNavigationProp = StackNavigationProp<RootStackParamList>;

interface AddAppointmentReminderProps {
  navigation: AddAppointmentReminderNavigationProp;
}

const AddAppointmentReminderScreen: React.FC<AddAppointmentReminderProps> = ({ navigation }) => {
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const { members } = useFamily();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setAppointmentTime(selectedTime);
    }
  };

  const getSelectedMemberName = () => {
    const member = members.find(m => m.id === selectedMemberId);
    return member?.name || 'Select Family Member';
  };

  const getAppointmentDateTime = () => {
    const date = new Date(appointmentDate);
    const time = new Date(appointmentTime);
    
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    return date;
  };

  const validateDateTime = () => {
    const appointmentDateTime = getAppointmentDateTime();
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      Alert.alert('Invalid Date/Time', 'Please select a future date and time for the appointment.');
      return false;
    }
    
    return true;
  };

  const handleSaveReminder = async () => {
    if (!doctorName.trim()) {
      Alert.alert('Error', 'Please enter doctor name');
      return;
    }

    if (!hospital.trim()) {
      Alert.alert('Error', 'Please enter hospital name');
      return;
    }

    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a family member');
      return;
    }

    if (!validateDateTime()) {
      return;
    }

    setLoading(true);

    try {
      await ReminderService.addAppointmentReminder({
        doctorName: doctorName.trim(),
        hospital: hospital.trim(),
        familyMemberId: selectedMemberId,
        appointmentDateTime: getAppointmentDateTime(),
        isActive: true,
      });

      Alert.alert(
        'Success',
        'Appointment reminder has been set successfully! You will be notified 2 hours before the appointment.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving appointment reminder:', error);
      Alert.alert('Error', 'Failed to save appointment reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.header}>
              <Avatar.Icon size={60} icon="calendar-clock" style={styles.headerIcon} />
              <View style={styles.headerText}>
                <Text variant="headlineSmall" style={styles.title}>
                  📅 Add Appointment Reminder
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Never miss a doctor's appointment with timely reminders
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            {/* Doctor Details */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Doctor Details
            </Text>
            <TextInput
              label="Doctor Name"
              value={doctorName}
              onChangeText={setDoctorName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Dr. Smith, Dr. Johnson"
              left={<TextInput.Icon icon="doctor" />}
            />

            <TextInput
              label="Hospital/Clinic"
              value={hospital}
              onChangeText={setHospital}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., City General Hospital, ABC Clinic"
              left={<TextInput.Icon icon="hospital-building" />}
            />

            <Divider style={styles.divider} />

            {/* Family Member Selection */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Family Member
            </Text>
            <Menu
              visible={showMemberMenu}
              onDismiss={() => setShowMemberMenu(false)}
              anchor={
                <TouchableRipple
                  onPress={() => setShowMemberMenu(true)}
                  style={styles.menuButton}
                >
                  <View style={styles.menuContent}>
                    <Text variant="bodyLarge" style={styles.menuText}>
                      {getSelectedMemberName()}
                    </Text>
                    <List.Icon icon="chevron-down" />
                  </View>
                </TouchableRipple>
              }
            >
              {members.map((member) => (
                <Menu.Item
                  key={member.id}
                  onPress={() => {
                    setSelectedMemberId(member.id);
                    setShowMemberMenu(false);
                  }}
                  title={member.name}
                  leadingIcon="account"
                />
              ))}
            </Menu>

            <Divider style={styles.divider} />

            {/* Date & Time Selection */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Appointment Date & Time
            </Text>
            
            {/* Date Selection */}
            <TouchableRipple
              onPress={() => setShowDatePicker(true)}
              style={styles.menuButton}
            >
              <View style={styles.menuContent}>
                <Text variant="bodyLarge" style={styles.menuText}>
                  📅 {appointmentDate.toLocaleDateString()}
                </Text>
                <List.Icon icon="calendar" />
              </View>
            </TouchableRipple>

            {showDatePicker && (
              <DateTimePicker
                value={appointmentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Time Selection */}
            <TouchableRipple
              onPress={() => setShowTimePicker(true)}
              style={styles.menuButton}
            >
              <View style={styles.menuContent}>
                <Text variant="bodyLarge" style={styles.menuText}>
                  ⏰ {appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <List.Icon icon="clock" />
              </View>
            </TouchableRipple>

            {showTimePicker && (
              <DateTimePicker
                value={appointmentTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            <Text variant="bodySmall" style={styles.helpText}>
              💡 You'll receive a notification 2 hours before the appointment
            </Text>
          </Card.Content>
        </Card>

        {/* Appointment Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              📋 Appointment Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Doctor:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {doctorName || 'Not selected'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Hospital:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {hospital || 'Not selected'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Patient:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {getSelectedMemberName()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Date & Time:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {getAppointmentDateTime().toLocaleString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              📋 How Appointment Reminders Work
            </Text>
            <View style={styles.infoList}>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • Get notified 2 hours before appointment time
              </Text>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • Includes doctor name and hospital details
              </Text>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • Automatically removes after appointment date
              </Text>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • Works even when the app is closed
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveReminder}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
          icon="check"
        >
          Save Reminder
        </Button>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: '#E3F2FD',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    lineHeight: 20,
  },
  formCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2196F3',
  },
  input: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    flex: 1,
  },
  helpText: {
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#F3E5F5',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#7B1FA2',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#7B1FA2',
  },
  summaryValue: {
    flex: 1,
    color: '#7B1FA2',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976D2',
  },
  infoList: {
    paddingLeft: 8,
  },
  infoItem: {
    marginBottom: 8,
    color: '#1976D2',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2196F3',
  },
  bottomPadding: {
    height: 20,
  },
});

export default AddAppointmentReminderScreen;
