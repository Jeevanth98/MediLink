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
  RadioButton,
  Switch,
  Divider,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { EmergencyService } from '../../services/EmergencyService';
import { EmergencyContact } from '../../types/Emergency';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AddEmergencyContactNavigationProp = StackNavigationProp<RootStackParamList>;
type AddEmergencyContactRouteProp = RouteProp<RootStackParamList>;

interface AddEmergencyContactScreenProps {
  navigation: AddEmergencyContactNavigationProp;
}

const AddEmergencyContactScreen: React.FC<AddEmergencyContactScreenProps> = ({ 
  navigation,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(true);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const { members, selectedMember } = useFamily();
  const { user } = useAuth();

  // Pre-select the currently selected member
  React.useEffect(() => {
    if (selectedMember && !selectedMemberId) {
      setSelectedMemberId(selectedMember.id);
    }
  }, [selectedMember, selectedMemberId]);

  const relationshipOptions = EmergencyService.getRelationshipOptions();

  const validateForm = () => {
    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a family member');
      return false;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter contact name');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!relationship) {
      Alert.alert('Error', 'Please select relationship');
      return false;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setSaving(true);
    try {
      const contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'> = {
        familyMemberId: selectedMemberId,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        relationship,
        isPrimaryContact,
        isEmergencyContact,
        address: address.trim() || undefined,
      };

      await EmergencyService.addEmergencyContact(user.id, contactData);

      Alert.alert(
        'Success',
        'Emergency contact added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedMemberName = selectedMemberId 
    ? members.find(m => m.id === selectedMemberId)?.name 
    : '';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Add Emergency Contact
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Add emergency contacts for quick access during medical emergencies
          </Text>
        </Card.Content>
      </Card>

      {/* Family Member Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Select Family Member
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Choose which family member this emergency contact is for
          </Text>
          
          <RadioButton.Group
            onValueChange={setSelectedMemberId}
            value={selectedMemberId}
          >
            {members.map(member => (
              <View key={member.id} style={styles.radioItem}>
                <RadioButton.Item
                  label={member.name}
                  value={member.id}
                  labelStyle={styles.radioLabel}
                />
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Contact Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contact Information
          </Text>
          
          <TextInput
            label="Contact Name *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
            placeholder="Enter full name"
          />
          
          <TextInput
            label="Phone Number *"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            placeholder="+91 9876543210"
          />
          
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            placeholder="contact@example.com"
          />
          
          <TextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={2}
            placeholder="Enter address (optional)"
          />
        </Card.Content>
      </Card>

      {/* Relationship */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Relationship *
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Select the relationship to {selectedMemberName || 'the family member'}
          </Text>
          
          <RadioButton.Group
            onValueChange={setRelationship}
            value={relationship}
          >
            {relationshipOptions.map((option) => (
              <View key={option.value} style={styles.radioItem}>
                <RadioButton.Item
                  label={option.label}
                  value={option.value}
                  labelStyle={styles.radioLabel}
                />
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Contact Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contact Settings
          </Text>
          
          <View style={styles.switchItem}>
            <View style={styles.switchText}>
              <Text variant="bodyLarge">Primary Emergency Contact</Text>
              <Text variant="bodySmall" style={styles.switchSubtext}>
                This person will be contacted first in emergencies
              </Text>
            </View>
            <Switch
              value={isPrimaryContact}
              onValueChange={setIsPrimaryContact}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.switchItem}>
            <View style={styles.switchText}>
              <Text variant="bodyLarge">Emergency Contact</Text>
              <Text variant="bodySmall" style={styles.switchSubtext}>
                Include in emergency contact list and alerts
              </Text>
            </View>
            <Switch
              value={isEmergencyContact}
              onValueChange={setIsEmergencyContact}
            />
          </View>
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
              {saving ? 'Saving...' : 'Save Contact'}
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
  radioItem: {
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchSubtext: {
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    marginVertical: 12,
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

export default AddEmergencyContactScreen;
