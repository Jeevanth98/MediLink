// Emergency-related types and interfaces
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isEmergencyContact: boolean;
  isPrimaryContact: boolean;
  familyMemberId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyHealthInfo {
  id: string;
  familyMemberId: string;
  bloodType?: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  emergencyNotes?: string;
  lastUpdated: Date;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire' | 'ambulance' | 'poison_control' | 'mental_health';
  phoneNumber: string;
  address?: string;
  website?: string;
  is24Hours: boolean;
  distance?: number; // in kilometers
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface EmergencyQRData {
  familyMemberId: string;
  name: string;
  age: number;
  bloodType?: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  emergencyContacts: {
    name: string;
    relationship: string;
    phone: string;
  }[];
  emergencyNotes?: string;
  generatedAt: Date;
}

export type EmergencyContactRelationship = 
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'grandparent'
  | 'friend'
  | 'doctor'
  | 'caregiver'
  | 'other';

export interface EmergencyState {
  contacts: EmergencyContact[];
  healthInfo: EmergencyHealthInfo[];
  nearbyServices: EmergencyService[];
  isLoading: boolean;
  error: string | null;
}
