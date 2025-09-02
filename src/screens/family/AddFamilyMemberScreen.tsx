import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFamily } from '../../contexts/FamilyContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AddFamilyMemberScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddFamilyMember'
>;

interface AddFamilyMemberProps {
  navigation: AddFamilyMemberScreenNavigationProp;
}

const AddFamilyMember: React.FC<AddFamilyMemberProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const { addFamilyMember } = useFamily();

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const addCondition = () => {
    if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
      setChronicConditions([...chronicConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setChronicConditions(chronicConditions.filter(c => c !== condition));
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the name');
      return false;
    }

    if (!age || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150) {
      Alert.alert('Error', 'Please enter a valid age (0-150)');
      return false;
    }

    if (!emergencyContactName.trim()) {
      Alert.alert('Error', 'Please enter emergency contact name');
      return false;
    }

    if (!emergencyContactRelationship.trim()) {
      Alert.alert('Error', 'Please enter emergency contact relationship');
      return false;
    }

    if (!emergencyContactPhone.trim()) {
      Alert.alert('Error', 'Please enter emergency contact phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await addFamilyMember({
        name: name.trim(),
        age: Number(age),
        gender,
        bloodGroup,
        chronicConditions,
        phoneNumber: phoneNumber.trim() || undefined,
        emergencyContact: {
          name: emergencyContactName.trim(),
          relationship: emergencyContactRelationship.trim(),
          phoneNumber: emergencyContactPhone.trim(),
        },
        isMainProfile: false,
      });

      Alert.alert(
        'Success',
        `${name} has been added to your family members.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add family member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Add Family Member
            </Text>
            
            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Age *"
              value={age}
              onChangeText={setAge}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text variant="bodyMedium" style={styles.sectionLabel}>
              Gender *
            </Text>
            <SegmentedButtons
              value={gender}
              onValueChange={(value) => setGender(value as 'male' | 'female' | 'other')}
              buttons={genderOptions}
              style={styles.segmentedButtons}
            />

            <Text variant="bodyMedium" style={styles.sectionLabel}>
              Blood Group *
            </Text>
            <View style={styles.bloodGroupContainer}>
              {bloodGroupOptions.map((option) => (
                <Chip
                  key={option.value}
                  selected={bloodGroup === option.value}
                  onPress={() => setBloodGroup(option.value as any)}
                  style={styles.bloodGroupChip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Phone Number (Optional)"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text variant="bodyMedium" style={styles.sectionLabel}>
              Chronic Conditions
            </Text>
            <View style={styles.conditionInputContainer}>
              <TextInput
                label="Add condition"
                value={newCondition}
                onChangeText={setNewCondition}
                mode="outlined"
                style={styles.conditionInput}
                onSubmitEditing={addCondition}
              />
              <Button
                mode="outlined"
                onPress={addCondition}
                style={styles.addButton}
                disabled={!newCondition.trim()}
              >
                Add
              </Button>
            </View>

            {chronicConditions.length > 0 && (
              <View style={styles.conditionsContainer}>
                {chronicConditions.map((condition, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeCondition(condition)}
                    style={styles.conditionChip}
                  >
                    {condition}
                  </Chip>
                ))}
              </View>
            )}

            <Text variant="titleMedium" style={styles.emergencyTitle}>
              Emergency Contact *
            </Text>

            <TextInput
              label="Emergency Contact Name *"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Relationship *"
              value={emergencyContactRelationship}
              onChangeText={setEmergencyContactRelationship}
              mode="outlined"
              placeholder="e.g., Father, Mother, Spouse, Friend"
              style={styles.input}
            />

            <TextInput
              label="Emergency Contact Phone *"
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />

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
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
              >
                Add Member
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    elevation: 4,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2196F3',
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    color: '#333',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  bloodGroupChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  conditionInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  conditionInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    height: 56,
    justifyContent: 'center',
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  conditionChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  emergencyTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    color: '#2196F3',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.45,
  },
  submitButton: {
    flex: 0.45,
  },
});

export default AddFamilyMember;
