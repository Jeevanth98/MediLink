import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyContact, EmergencyHealthInfo, EmergencyService as EmergencyServiceType, EmergencyQRData, EmergencyContactRelationship } from '../types/Emergency';
import { FamilyMember } from '../types/User';

export class EmergencyService {
  private static readonly STORAGE_KEYS = {
    CONTACTS: 'emergency_contacts',
    HEALTH_INFO: 'emergency_health_info',
    SERVICES: 'emergency_services',
  };

  // Emergency Services Data (Default Indian Emergency Services)
  private static readonly DEFAULT_SERVICES: EmergencyServiceType[] = [
    {
      id: 'ambulance-108',
      name: 'Ambulance Service',
      type: 'ambulance',
      phoneNumber: '108',
      is24Hours: true,
    },
    {
      id: 'police-100',
      name: 'Police Emergency',
      type: 'police',
      phoneNumber: '100',
      is24Hours: true,
    },
    {
      id: 'fire-101',
      name: 'Fire Emergency',
      type: 'fire',
      phoneNumber: '101',
      is24Hours: true,
    },
    {
      id: 'women-helpline-1091',
      name: 'Women Helpline',
      type: 'police',
      phoneNumber: '1091',
      is24Hours: true,
    },
    {
      id: 'child-helpline-1098',
      name: 'Child Helpline',
      type: 'police',
      phoneNumber: '1098',
      is24Hours: true,
    },
    {
      id: 'disaster-108',
      name: 'Disaster Management',
      type: 'ambulance',
      phoneNumber: '108',
      is24Hours: true,
    },
    {
      id: 'mental-health-kiran',
      name: 'Mental Health Support (Kiran)',
      type: 'mental_health',
      phoneNumber: '1800-599-0019',
      is24Hours: true,
    },
    {
      id: 'senior-citizen-14567',
      name: 'Senior Citizen Helpline',
      type: 'ambulance',
      phoneNumber: '14567',
      is24Hours: true,
    },
  ];

  // Emergency Contacts Management
  static async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.CONTACTS}_${userId}`);
      if (stored) {
        return JSON.parse(stored).map((contact: any) => ({
          ...contact,
          createdAt: new Date(contact.createdAt),
          updatedAt: new Date(contact.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      return [];
    }
  }

  static async addEmergencyContact(
    userId: string,
    contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EmergencyContact> {
    try {
      const newContact: EmergencyContact = {
        ...contact,
        id: `emergency_contact_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingContacts = await this.getEmergencyContacts(userId);
      
      // If this is set as primary, remove primary flag from others for this family member
      if (newContact.isPrimaryContact) {
        existingContacts.forEach(c => {
          if (c.familyMemberId === newContact.familyMemberId) {
            c.isPrimaryContact = false;
          }
        });
      }

      const updatedContacts = [...existingContacts, newContact];
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.CONTACTS}_${userId}`,
        JSON.stringify(updatedContacts)
      );

      return newContact;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  static async updateEmergencyContact(
    userId: string,
    contactId: string,
    updates: Partial<EmergencyContact>
  ): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts(userId);
      const contactIndex = contacts.findIndex(c => c.id === contactId);
      
      if (contactIndex === -1) {
        throw new Error('Contact not found');
      }

      // If updating to primary, remove primary flag from others for this family member
      if (updates.isPrimaryContact) {
        contacts.forEach(c => {
          if (c.familyMemberId === contacts[contactIndex].familyMemberId && c.id !== contactId) {
            c.isPrimaryContact = false;
          }
        });
      }

      contacts[contactIndex] = {
        ...contacts[contactIndex],
        ...updates,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.CONTACTS}_${userId}`,
        JSON.stringify(contacts)
      );
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  }

  static async deleteEmergencyContact(userId: string, contactId: string): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts(userId);
      const filteredContacts = contacts.filter(c => c.id !== contactId);
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.CONTACTS}_${userId}`,
        JSON.stringify(filteredContacts)
      );
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      throw error;
    }
  }

  // Emergency Health Info Management
  static async getEmergencyHealthInfo(userId: string, familyMemberId: string): Promise<EmergencyHealthInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.HEALTH_INFO}_${userId}`);
      if (stored) {
        const healthInfoList = JSON.parse(stored).map((info: any) => ({
          ...info,
          lastUpdated: new Date(info.lastUpdated),
        }));
        return healthInfoList.find((info: EmergencyHealthInfo) => info.familyMemberId === familyMemberId) || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting emergency health info:', error);
      return null;
    }
  }

  static async saveEmergencyHealthInfo(
    userId: string,
    healthInfo: Omit<EmergencyHealthInfo, 'id' | 'lastUpdated'>
  ): Promise<EmergencyHealthInfo> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.HEALTH_INFO}_${userId}`);
      let healthInfoList: EmergencyHealthInfo[] = [];
      
      if (stored) {
        healthInfoList = JSON.parse(stored).map((info: any) => ({
          ...info,
          lastUpdated: new Date(info.lastUpdated),
        }));
      }

      // Check if health info exists for this family member
      const existingIndex = healthInfoList.findIndex(info => info.familyMemberId === healthInfo.familyMemberId);
      
      const newHealthInfo: EmergencyHealthInfo = {
        ...healthInfo,
        id: existingIndex !== -1 ? healthInfoList[existingIndex].id : `health_info_${Date.now()}`,
        lastUpdated: new Date(),
      };

      if (existingIndex !== -1) {
        healthInfoList[existingIndex] = newHealthInfo;
      } else {
        healthInfoList.push(newHealthInfo);
      }

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.HEALTH_INFO}_${userId}`,
        JSON.stringify(healthInfoList)
      );

      return newHealthInfo;
    } catch (error) {
      console.error('Error saving emergency health info:', error);
      throw error;
    }
  }

  // Emergency Services
  static getEmergencyServices(): EmergencyServiceType[] {
    return this.DEFAULT_SERVICES;
  }

  static getServicesByType(type: EmergencyServiceType['type']): EmergencyServiceType[] {
    return this.DEFAULT_SERVICES.filter(service => service.type === type);
  }

  // Emergency QR Code Generation
  static async generateEmergencyQR(userId: string, familyMember: FamilyMember): Promise<EmergencyQRData> {
    try {
      const [healthInfo, contacts] = await Promise.all([
        this.getEmergencyHealthInfo(userId, familyMember.id),
        this.getEmergencyContacts(userId)
      ]);

      const memberContacts = contacts
        .filter(c => c.familyMemberId === familyMember.id && c.isEmergencyContact)
        .sort((a, b) => (b.isPrimaryContact ? 1 : 0) - (a.isPrimaryContact ? 1 : 0))
        .slice(0, 3) // Limit to 3 contacts for QR size
        .map(c => ({
          name: c.name,
          relationship: c.relationship,
          phone: c.phoneNumber,
        }));

      const qrData: EmergencyQRData = {
        familyMemberId: familyMember.id,
        name: familyMember.name,
        age: familyMember.age,
        bloodType: healthInfo?.bloodType,
        allergies: healthInfo?.allergies || [],
        medications: healthInfo?.medications || [],
        medicalConditions: healthInfo?.medicalConditions || [],
        emergencyContacts: memberContacts,
        emergencyNotes: healthInfo?.emergencyNotes,
        generatedAt: new Date(),
      };

      return qrData;
    } catch (error) {
      console.error('Error generating emergency QR:', error);
      throw error;
    }
  }

  // Emergency Call Actions
  static makeEmergencyCall(phoneNumber: string): void {
    try {
      const { Linking } = require('react-native');
      Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.error('Error making emergency call:', error);
    }
  }

  static sendEmergencySMS(phoneNumber: string, message: string): void {
    try {
      const { Linking } = require('react-native');
      const encodedMessage = encodeURIComponent(message);
      Linking.openURL(`sms:${phoneNumber}?body=${encodedMessage}`);
    } catch (error) {
      console.error('Error sending emergency SMS:', error);
    }
  }

  // Utility Functions
  static getRelationshipOptions(): { value: EmergencyContactRelationship; label: string }[] {
    return [
      { value: 'spouse', label: 'Spouse' },
      { value: 'parent', label: 'Parent' },
      { value: 'child', label: 'Child' },
      { value: 'sibling', label: 'Sibling' },
      { value: 'grandparent', label: 'Grandparent' },
      { value: 'friend', label: 'Friend' },
      { value: 'doctor', label: 'Doctor' },
      { value: 'caregiver', label: 'Caregiver' },
      { value: 'other', label: 'Other' },
    ];
  }

  static getBloodTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
    ];
  }

  // Emergency Template Messages
  static getEmergencyMessage(familyMember: FamilyMember, location?: string): string {
    const locationText = location ? ` at ${location}` : '';
    return `🚨 EMERGENCY ALERT 🚨\n\n${familyMember.name} needs immediate medical assistance${locationText}.\n\nPlease respond immediately or call emergency services.\n\nSent from MediLink Emergency System.`;
  }

  static getQuickEmergencyMessage(): string {
    return `🚨 EMERGENCY 🚨\n\nI need immediate help. Please call emergency services and come to my location.\n\nSent from MediLink Emergency System.`;
  }
}
