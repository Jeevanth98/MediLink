import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  IconButton,
  RadioButton,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { EmergencyService } from '../../services/EmergencyService';
import { EmergencyHealthInfo } from '../../types/Emergency';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EditEmergencyHealthNavigationProp = StackNavigationProp<RootStackParamList>;
type EditEmergencyHealthRouteProp = RouteProp<RootStackParamList>;

interface EditEmergencyHealthScreenProps {
  navigation: EditEmergencyHealthNavigationProp;
  route: EditEmergencyHealthRouteProp;
}

const EditEmergencyHealthScreen: React.FC<EditEmergencyHealthScreenProps> = ({
  navigation,
  route,
}) => {
  const { memberId } = route.params as { memberId: string };
  
  const [bloodType, setBloodType] = useState<string>('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { members } = useFamily();
  const { user } = useAuth();

  const bloodTypeOptions = EmergencyService.getBloodTypeOptions();
  const member = members.find(m => m.id === memberId);

  const loadHealthInfo = useCallback(async () => {
    if (!user || !memberId) return;

    try {
      setLoading(true);
      const healthInfo = await EmergencyService.getEmergencyHealthInfo(user.id, memberId);
      
      if (healthInfo) {
        setBloodType(healthInfo.bloodType || '');
        setAllergies(healthInfo.allergies || []);
        setMedications(healthInfo.medications || []);
        setMedicalConditions(healthInfo.medicalConditions || []);
        setEmergencyNotes(healthInfo.emergencyNotes || '');
      }
    } catch (error) {
      console.error('Error loading health info:', error);
    } finally {
      setLoading(false);
    }
  }, [user, memberId]);

  useEffect(() => {
    loadHealthInfo();
  }, [loadHealthInfo]);

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    setMedications(medications.filter(m => m !== medication));
  };

  const addCondition = () => {
    if (newCondition.trim() && !medicalConditions.includes(newCondition.trim())) {
      setMedicalConditions([...medicalConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== condition));
  };

  const handleSave = async () => {
    if (!user || !memberId) return;

    setSaving(true);
    try {
      const healthData: Omit<EmergencyHealthInfo, 'id' | 'lastUpdated'> = {
        familyMemberId: memberId,
        bloodType: bloodType || undefined,
        allergies,
        medications,
        medicalConditions,
        emergencyNotes: emergencyNotes.trim() || undefined,
      };

      await EmergencyService.saveEmergencyHealthInfo(user.id, healthData);

      Alert.alert(
        'Success',
        'Emergency health information updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving health info:', error);
      Alert.alert('Error', 'Failed to save health information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading health information...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Member not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Emergency Health Info
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Managing health information for {member.name}
          </Text>
        </Card.Content>
      </Card>

      {/* Blood Type */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Blood Type
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Select the blood type for emergency situations
          </Text>
          
          <RadioButton.Group
            onValueChange={setBloodType}
            value={bloodType}
          >
            <View style={styles.bloodTypeGrid}>
              {bloodTypeOptions.map((option) => (
                <View key={option.value} style={styles.bloodTypeItem}>
                  <RadioButton.Item
                    label={option.label}
                    value={option.value}
                    labelStyle={styles.bloodTypeLabel}
                  />
                </View>
              ))}
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Allergies */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Allergies
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            List known allergies for emergency medical reference
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Add Allergy"
              value={newAllergy}
              onChangeText={setNewAllergy}
              style={styles.flexInput}
              mode="outlined"
              placeholder="e.g., Penicillin, Peanuts, Shellfish"
              onSubmitEditing={addAllergy}
            />
            <IconButton
              icon="plus"
              mode="contained"
              onPress={addAllergy}
              disabled={!newAllergy.trim()}
            />
          </View>
          
          {allergies.length > 0 && (
            <View style={styles.chipContainer}>
              {allergies.map((allergy, index) => (
                <Chip
                  key={index}
                  style={styles.allergyChip}
                  onClose={() => removeAllergy(allergy)}
                  closeIcon="close"
                >
                  {allergy}
                </Chip>
              ))}
            </View>
          )}
          
          {allergies.length === 0 && (
            <Text variant="bodySmall" style={styles.emptyText}>
              No allergies added yet
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Current Medications */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Current Medications
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            List current medications for drug interaction checks
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Add Medication"
              value={newMedication}
              onChangeText={setNewMedication}
              style={styles.flexInput}
              mode="outlined"
              placeholder="e.g., Aspirin 100mg, Metformin 500mg"
              onSubmitEditing={addMedication}
            />
            <IconButton
              icon="plus"
              mode="contained"
              onPress={addMedication}
              disabled={!newMedication.trim()}
            />
          </View>
          
          {medications.length > 0 && (
            <View style={styles.chipContainer}>
              {medications.map((medication, index) => (
                <Chip
                  key={index}
                  style={styles.medicationChip}
                  onClose={() => removeMedication(medication)}
                  closeIcon="close"
                >
                  {medication}
                </Chip>
              ))}
            </View>
          )}
          
          {medications.length === 0 && (
            <Text variant="bodySmall" style={styles.emptyText}>
              No medications added yet
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Medical Conditions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Medical Conditions
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            List chronic conditions and important medical history
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Add Medical Condition"
              value={newCondition}
              onChangeText={setNewCondition}
              style={styles.flexInput}
              mode="outlined"
              placeholder="e.g., Diabetes, Hypertension, Asthma"
              onSubmitEditing={addCondition}
            />
            <IconButton
              icon="plus"
              mode="contained"
              onPress={addCondition}
              disabled={!newCondition.trim()}
            />
          </View>
          
          {medicalConditions.length > 0 && (
            <View style={styles.chipContainer}>
              {medicalConditions.map((condition, index) => (
                <Chip
                  key={index}
                  style={styles.conditionChip}
                  onClose={() => removeCondition(condition)}
                  closeIcon="close"
                >
                  {condition}
                </Chip>
              ))}
            </View>
          )}
          
          {medicalConditions.length === 0 && (
            <Text variant="bodySmall" style={styles.emptyText}>
              No medical conditions added yet
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Emergency Notes */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Emergency Notes
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Additional important information for emergency responders
          </Text>
          
          <TextInput
            label="Emergency Notes"
            value={emergencyNotes}
            onChangeText={setEmergencyNotes}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="e.g., Wears contact lenses, uses hearing aid, medical device implants, special care instructions..."
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
              loading={saving}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Health Info'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#F44336',
  },
  subtitle: {
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  flexInput: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  allergyChip: {
    backgroundColor: '#FFEBEE',
  },
  medicationChip: {
    backgroundColor: '#E8F5E8',
  },
  conditionChip: {
    backgroundColor: '#FFF3E0',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bloodTypeItem: {
    width: '50%',
  },
  bloodTypeLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
  },
  bottomPadding: {
    height: 32,
  },
});

export default EditEmergencyHealthScreen;
