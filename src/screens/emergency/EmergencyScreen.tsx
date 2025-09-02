import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { EmergencyService as EmergencyServiceClass } from '../../services/EmergencyService';
import { EmergencyContact, EmergencyHealthInfo, EmergencyService as EmergencyServiceType } from '../../types/Emergency';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EmergencyScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface EmergencyScreenProps {
  navigation: EmergencyScreenNavigationProp;
}

const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ navigation }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [healthInfo, setHealthInfo] = useState<EmergencyHealthInfo[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyServiceType[]>([]);
  const [activeTab, setActiveTab] = useState<'contacts' | 'services' | 'health'>('contacts');
  const [refreshing, setRefreshing] = useState(false);

  const { members, selectedMember } = useFamily();
  const { user } = useAuth();

  useEffect(() => {
    loadEmergencyData();
  }, [user, loadEmergencyData]);

  const loadEmergencyData = useCallback(async () => {
    if (!user) return;

    try {
      const [contactsData, servicesData] = await Promise.all([
        EmergencyServiceClass.getEmergencyContacts(user.id),
        Promise.resolve(EmergencyServiceClass.getEmergencyServices())
      ]);

      setContacts(contactsData);
      setEmergencyServices(servicesData);

      // Load health info for all family members
      const healthPromises = members.map(member =>
        EmergencyServiceClass.getEmergencyHealthInfo(user.id, member.id)
      );
      const healthResults = await Promise.all(healthPromises);
      setHealthInfo(healthResults.filter(Boolean) as EmergencyHealthInfo[]);
    } catch (error) {
      console.error('Error loading emergency data:', error);
    }
  }, [user, members]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmergencyData();
    setRefreshing(false);
  };

  const handleEmergencyCall = (phoneNumber: string, serviceName: string) => {
    Alert.alert(
      'Emergency Call',
      `Call ${serviceName} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => EmergencyServiceClass.makeEmergencyCall(phoneNumber),
        },
      ]
    );
  };

  const handleContactCall = (contact: EmergencyContact) => {
    Alert.alert(
      'Call Emergency Contact',
      `Call ${contact.name} (${contact.relationship})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => EmergencyServiceClass.makeEmergencyCall(contact.phoneNumber),
        },
        {
          text: 'Send SMS',
          onPress: () => {
            const member = members.find(m => m.id === contact.familyMemberId);
            if (member) {
              const message = EmergencyServiceClass.getEmergencyMessage(member);
              EmergencyServiceClass.sendEmergencySMS(contact.phoneNumber, message);
            }
          },
        },
      ]
    );
  };

  const handleQuickEmergency = () => {
    Alert.alert(
      '🚨 EMERGENCY ALERT 🚨',
      'This will immediately call emergency services and send alerts to your emergency contacts. Use only in real emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CALL 108 (Ambulance)',
          style: 'destructive',
          onPress: () => {
            EmergencyServiceClass.makeEmergencyCall('108');
            // Also send SMS to emergency contacts
            sendEmergencyAlerts();
          },
        },
      ]
    );
  };

  const sendEmergencyAlerts = () => {
    if (!selectedMember) return;

    const memberContacts = contacts.filter(
      c => c.familyMemberId === selectedMember.id && c.isEmergencyContact
    );

    if (memberContacts.length > 0) {
      const message = EmergencyServiceClass.getQuickEmergencyMessage();
      memberContacts.forEach(contact => {
        EmergencyServiceClass.sendEmergencySMS(contact.phoneNumber, message);
      });
      
      Alert.alert(
        'Emergency Alerts Sent',
        `Emergency SMS sent to ${memberContacts.length} contacts.`,
        [{ text: 'OK' }]
      );
    }
  };

  const generateEmergencyQR = async (memberId: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member || !user) return;

      const qrData = await EmergencyServiceClass.generateEmergencyQR(user.id, member);
      
      // For now, show QR data in alert (you can integrate with QR code library later)
      Alert.alert(
        'Emergency QR Generated',
        `QR code data for ${member.name}:\n\nBlood Type: ${qrData.bloodType || 'Unknown'}\nAllergies: ${qrData.allergies.join(', ') || 'None'}\nEmergency Contacts: ${qrData.emergencyContacts.length}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate emergency QR code');
    }
  };

  const getMemberContacts = (memberId: string) => {
    return contacts.filter(c => c.familyMemberId === memberId);
  };

  const getMemberHealthInfo = (memberId: string) => {
    return healthInfo.find(h => h.familyMemberId === memberId);
  };

  const getServiceIcon = (type: EmergencyServiceType['type']) => {
    switch (type) {
      case 'ambulance': return 'ambulance';
      case 'police': return 'shield-account';
      case 'fire': return 'fire';
      case 'hospital': return 'hospital-building';
      case 'mental_health': return 'head-heart';
      case 'poison_control': return 'bottle-tonic-skull';
      default: return 'phone';
    }
  };

  const getServiceColor = (type: EmergencyServiceType['type']) => {
    switch (type) {
      case 'ambulance': return '#FF5722';
      case 'police': return '#2196F3';
      case 'fire': return '#F44336';
      case 'hospital': return '#4CAF50';
      case 'mental_health': return '#9C27B0';
      case 'poison_control': return '#FF9800';
      default: return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Emergency Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.header}>
              <Avatar.Icon size={60} icon="medical-bag" style={styles.headerIcon} />
              <View style={styles.headerText}>
                <Text variant="headlineSmall" style={styles.title}>
                  🚨 Emergency Services
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Quick access to emergency contacts and services
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Emergency Button */}
        <Card style={styles.quickEmergencyCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleQuickEmergency}
              style={styles.quickEmergencyButton}
              labelStyle={styles.quickEmergencyText}
              icon="phone-alert"
            >
              🚨 EMERGENCY CALL 108
            </Button>
            <Text variant="bodySmall" style={styles.emergencyNote}>
              Tap only in real emergencies. This will call ambulance services immediately.
            </Text>
          </Card.Content>
        </Card>

        {/* Tab Selection */}
        <Card style={styles.tabCard}>
          <Card.Content>
            <View style={styles.tabContainer}>
              <Button
                mode={activeTab === 'contacts' ? 'contained' : 'outlined'}
                onPress={() => setActiveTab('contacts')}
                style={styles.tabButton}
                icon="account-group"
              >
                Contacts ({contacts.length})
              </Button>
              <Button
                mode={activeTab === 'services' ? 'contained' : 'outlined'}
                onPress={() => setActiveTab('services')}
                style={styles.tabButton}
                icon="phone"
              >
                Services
              </Button>
              <Button
                mode={activeTab === 'health' ? 'contained' : 'outlined'}
                onPress={() => setActiveTab('health')}
                style={styles.tabButton}
                icon="heart-pulse"
              >
                Health Info
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Emergency Contacts Tab */}
        {activeTab === 'contacts' && (
          <>
            {contacts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyState}>
                  <Avatar.Icon size={80} icon="account-plus" style={styles.emptyIcon} />
                  <Text variant="headlineSmall" style={styles.emptyTitle}>
                    No Emergency Contacts
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Add emergency contacts for quick access during emergencies. Include family, friends, and doctors.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <>
                {members.map(member => {
                  const memberContacts = getMemberContacts(member.id);
                  if (memberContacts.length === 0) return null;

                  return (
                    <Card key={member.id} style={styles.memberCard}>
                      <Card.Content>
                        <View style={styles.memberHeader}>
                          <Avatar.Text size={40} label={member.name[0]} />
                          <View style={styles.memberInfo}>
                            <Text variant="titleMedium">{member.name}</Text>
                            <Text variant="bodySmall">
                              {memberContacts.length} emergency contact(s)
                            </Text>
                          </View>
                          <IconButton
                            icon="qrcode"
                            onPress={() => generateEmergencyQR(member.id)}
                          />
                        </View>
                        
                        <Divider style={styles.divider} />
                        
                        {memberContacts.map(contact => (
                          <List.Item
                            key={contact.id}
                            title={contact.name}
                            description={`${contact.relationship} • ${contact.phoneNumber}`}
                            left={() => (
                              <Avatar.Icon 
                                size={40} 
                                icon={contact.isPrimaryContact ? "star" : "account"} 
                                style={{ backgroundColor: contact.isPrimaryContact ? '#FFD700' : '#E3F2FD' }}
                              />
                            )}
                            right={() => (
                              <View style={styles.contactActions}>
                                <IconButton
                                  icon="phone"
                                  onPress={() => handleContactCall(contact)}
                                />
                                <IconButton
                                  icon="pencil"
                                  onPress={() => navigation.navigate('EditEmergencyContact' as any, { contactId: contact.id })}
                                />
                              </View>
                            )}
                            onPress={() => handleContactCall(contact)}
                          />
                        ))}
                      </Card.Content>
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Emergency Services Tab */}
        {activeTab === 'services' && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📞 Emergency Services
            </Text>
            {emergencyServices.map(service => (
              <Card key={service.id} style={styles.serviceCard}>
                <Card.Content>
                  <List.Item
                    title={service.name}
                    description={`${service.phoneNumber}${service.is24Hours ? ' • 24/7 Available' : ''}`}
                    left={() => (
                      <Avatar.Icon 
                        size={50} 
                        icon={getServiceIcon(service.type)} 
                        style={{ backgroundColor: getServiceColor(service.type) }}
                      />
                    )}
                    right={() => (
                      <Button
                        mode="contained"
                        onPress={() => handleEmergencyCall(service.phoneNumber, service.name)}
                        style={{ backgroundColor: getServiceColor(service.type) }}
                      >
                        Call
                      </Button>
                    )}
                    onPress={() => handleEmergencyCall(service.phoneNumber, service.name)}
                  />
                </Card.Content>
              </Card>
            ))}
          </>
        )}

        {/* Health Info Tab */}
        {activeTab === 'health' && (
          <>
            {members.map(member => {
              const memberHealthInfo = getMemberHealthInfo(member.id);
              
              return (
                <Card key={member.id} style={styles.memberCard}>
                  <Card.Content>
                    <View style={styles.memberHeader}>
                      <Avatar.Text size={40} label={member.name[0]} />
                      <View style={styles.memberInfo}>
                        <Text variant="titleMedium">{member.name}</Text>
                        <Text variant="bodySmall">
                          {memberHealthInfo ? 'Health info available' : 'No health info'}
                        </Text>
                      </View>
                      <IconButton
                        icon="pencil"
                        onPress={() => navigation.navigate('EditEmergencyHealth' as any, { memberId: member.id })}
                      />
                    </View>
                    
                    {memberHealthInfo ? (
                      <View style={styles.healthInfo}>
                        <Divider style={styles.divider} />
                        
                        {memberHealthInfo.bloodType && (
                          <View style={styles.healthItem}>
                            <Text variant="labelMedium">Blood Type:</Text>
                            <Chip>{memberHealthInfo.bloodType}</Chip>
                          </View>
                        )}
                        
                        {memberHealthInfo.allergies.length > 0 && (
                          <View style={styles.healthItem}>
                            <Text variant="labelMedium">Allergies:</Text>
                            <View style={styles.chipContainer}>
                              {memberHealthInfo.allergies.map((allergy: string, index: number) => (
                                <Chip key={index} style={styles.allergyChip}>{allergy}</Chip>
                              ))}
                            </View>
                          </View>
                        )}
                        
                        {memberHealthInfo.medications.length > 0 && (
                          <View style={styles.healthItem}>
                            <Text variant="labelMedium">Current Medications:</Text>
                            <View style={styles.chipContainer}>
                              {memberHealthInfo.medications.map((medication: string, index: number) => (
                                <Chip key={index} style={styles.medicationChip}>{medication}</Chip>
                              ))}
                            </View>
                          </View>
                        )}
                        
                        {memberHealthInfo.medicalConditions.length > 0 && (
                          <View style={styles.healthItem}>
                            <Text variant="labelMedium">Medical Conditions:</Text>
                            <View style={styles.chipContainer}>
                              {memberHealthInfo.medicalConditions.map((condition: string, index: number) => (
                                <Chip key={index} style={styles.conditionChip}>{condition}</Chip>
                              ))}
                            </View>
                          </View>
                        )}
                        
                        {memberHealthInfo.emergencyNotes && (
                          <View style={styles.healthItem}>
                            <Text variant="labelMedium">Emergency Notes:</Text>
                            <Text variant="bodyMedium">{memberHealthInfo.emergencyNotes}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.noHealthInfo}>
                        <Text variant="bodyMedium" style={styles.noHealthText}>
                          No emergency health information available. Tap edit to add blood type, allergies, medications, and other important medical details.
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
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
            'Add Emergency Info',
            'What would you like to add?',
            [
              {
                text: 'Emergency Contact',
                onPress: () => navigation.navigate('AddEmergencyContact' as any),
              },
              {
                text: 'Health Information',
                onPress: () => {
                  if (selectedMember) {
                    navigation.navigate('EditEmergencyHealth' as any, { memberId: selectedMember.id });
                  } else {
                    Alert.alert('Please select a family member first');
                  }
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
        label="Add Emergency Info"
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
    backgroundColor: '#FFEBEE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: '#F44336',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#D32F2F',
  },
  subtitle: {
    color: '#666',
    lineHeight: 20,
  },
  quickEmergencyCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFCDD2',
  },
  quickEmergencyButton: {
    backgroundColor: '#F44336',
    marginBottom: 8,
  },
  quickEmergencyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyNote: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  tabCard: {
    margin: 16,
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginVertical: 12,
    fontWeight: 'bold',
    color: '#F44336',
  },
  memberCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    marginVertical: 8,
  },
  contactActions: {
    flexDirection: 'row',
  },
  serviceCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  healthInfo: {
    marginTop: 8,
  },
  healthItem: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
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
  noHealthInfo: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  noHealthText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
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
    backgroundColor: '#F44336',
  },
  bottomPadding: {
    height: 100,
  },
});

export default EmergencyScreen;
