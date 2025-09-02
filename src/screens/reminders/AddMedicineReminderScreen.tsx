import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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

type AddMedicineReminderNavigationProp = StackNavigationProp<RootStackParamList>;

interface AddMedicineReminderProps {
  navigation: AddMedicineReminderNavigationProp;
}

const AddMedicineReminderScreen: React.FC<AddMedicineReminderProps> = ({ navigation }) => {
  const [medicineName, setMedicineName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'twice_daily' | 'three_times_daily' | 'weekly'>('daily');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const { members } = useFamily();

  const frequencyOptions: Array<{value: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly', label: string}> = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'three_times_daily', label: '3 Times Daily' },
    { value: 'weekly', label: 'Weekly' },
  ];

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  const getSelectedMemberName = () => {
    const member = members.find(m => m.id === selectedMemberId);
    return member?.name || 'Select Family Member';
  };

  const getSelectedFrequencyLabel = () => {
    const frequency = frequencyOptions.find(f => f.value === selectedFrequency);
    return frequency?.label || 'Select Frequency';
  };

  const handleSaveReminder = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please enter medicine name');
      return;
    }

    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a family member');
      return;
    }

    setLoading(true);

    try {
      await ReminderService.addMedicineReminder({
        medicineName: medicineName.trim(),
        familyMemberId: selectedMemberId,
        frequency: selectedFrequency,
        timeOfDay: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isActive: true,
      });

      Alert.alert(
        'Success',
        'Medicine reminder has been set successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving medicine reminder:', error);
      Alert.alert('Error', 'Failed to save medicine reminder. Please try again.');
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
              <Avatar.Icon size={60} icon="pill" style={styles.headerIcon} />
              <View style={styles.headerText}>
                <Text variant="headlineSmall" style={styles.title}>
                  💊 Add Medicine Reminder
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Set up medication reminders to stay on track with your health
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            {/* Medicine Name */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Medicine Details
            </Text>
            <TextInput
              label="Medicine Name"
              value={medicineName}
              onChangeText={setMedicineName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Vitamin D, Aspirin, Metformin"
              left={<TextInput.Icon icon="pill" />}
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

            {/* Frequency Selection */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Frequency
            </Text>
            <Menu
              visible={showFrequencyMenu}
              onDismiss={() => setShowFrequencyMenu(false)}
              anchor={
                <TouchableRipple
                  onPress={() => setShowFrequencyMenu(true)}
                  style={styles.menuButton}
                >
                  <View style={styles.menuContent}>
                    <Text variant="bodyLarge" style={styles.menuText}>
                      {getSelectedFrequencyLabel()}
                    </Text>
                    <List.Icon icon="chevron-down" />
                  </View>
                </TouchableRipple>
              }
            >
              {frequencyOptions.map((option) => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    setSelectedFrequency(option.value);
                    setShowFrequencyMenu(false);
                  }}
                  title={option.label}
                  leadingIcon="repeat"
                />
              ))}
            </Menu>

            <Divider style={styles.divider} />

            {/* Time Selection */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reminder Time
            </Text>
            <TouchableRipple
              onPress={() => setShowTimePicker(true)}
              style={styles.menuButton}
            >
              <View style={styles.menuContent}>
                <Text variant="bodyLarge" style={styles.menuText}>
                  {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <List.Icon icon="clock" />
              </View>
            </TouchableRipple>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <Text variant="bodySmall" style={styles.helpText}>
              💡 You'll receive a notification 15 minutes before the scheduled time
            </Text>
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              📋 How Medicine Reminders Work
            </Text>
            <View style={styles.infoList}>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • Get notified 15 minutes before medicine time
              </Text>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • Reminders repeat based on your selected frequency
              </Text>
              <Text variant="bodyMedium" style={styles.infoItem}>
                • You can enable/disable reminders anytime
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
    backgroundColor: '#E8F5E8',
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

export default AddMedicineReminderScreen;
