export interface User {
  id: string;
  email: string;
  username: string;
  phoneNumber?: string;
  role: 'patient' | 'caregiver' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  userId: string; // Reference to the main user
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  chronicConditions: string[];
  phoneNumber?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  isMainProfile: boolean; // True for the account owner
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyAccessInfo {
  memberId: string;
  isEnabled: boolean;
  qrCode?: string;
  accessCode?: string;
  lastUpdated: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface FamilyState {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  isLoading: boolean;
}
