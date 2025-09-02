import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FamilyMember, FamilyState } from '../types/User';
import { useAuth } from './SimpleAuthContext';

interface FamilyContextType extends FamilyState {
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFamilyMember: (memberId: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteFamilyMember: (memberId: string) => Promise<void>;
  selectMember: (member: FamilyMember) => void;
  refreshMembers: () => Promise<void>;
  generateEmergencyQR: (memberId: string) => Promise<string>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider: React.FC<FamilyProviderProps> = ({ children }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFamilyMembers();
    } else {
      setMembers([]);
      setSelectedMember(null);
    }
  }, [isAuthenticated, user]);

  const getFamilyMembersKey = () => {
    return `familyMembers_${user?.id}`;
  };

  const loadFamilyMembers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(getFamilyMembersKey());
      if (stored) {
        const familyMembers: FamilyMember[] = JSON.parse(stored).map((member: any) => ({
          ...member,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        }));
        setMembers(familyMembers);
        
        // Auto-select main profile if it exists
        const mainProfile = familyMembers.find(m => m.isMainProfile);
        if (mainProfile && !selectedMember) {
          setSelectedMember(mainProfile);
        }
      } else {
        // Create main profile automatically if no members exist
        await createMainProfile();
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFamilyMembers = async (updatedMembers: FamilyMember[]) => {
    try {
      await AsyncStorage.setItem(getFamilyMembersKey(), JSON.stringify(updatedMembers));
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error saving family members:', error);
      throw error;
    }
  };

  const createMainProfile = async () => {
    if (!user) return;

    const mainProfile: FamilyMember = {
      id: `main-${user.id}`,
      userId: user.id,
      name: user.username || user.email.split('@')[0],
      age: 25, // Default age
      gender: 'male', // Default gender
      bloodGroup: 'O+', // Default blood group
      chronicConditions: [],
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Contact',
        phoneNumber: '911',
      },
      isMainProfile: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveFamilyMembers([mainProfile]);
    setSelectedMember(mainProfile);
  };

  const addFamilyMember = async (memberData: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const newMember: FamilyMember = {
        ...memberData,
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMembers = [...members, newMember];
      await saveFamilyMembers(updatedMembers);
      
      console.log('Family member added successfully');
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFamilyMember = async (memberId: string, updates: Partial<FamilyMember>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const updatedMembers = members.map(member =>
        member.id === memberId
          ? { ...member, ...updates, updatedAt: new Date() }
          : member
      );

      await saveFamilyMembers(updatedMembers);

      // Update selected member if it was the one being updated
      if (selectedMember?.id === memberId) {
        const updatedSelected = updatedMembers.find(m => m.id === memberId);
        if (updatedSelected) {
          setSelectedMember(updatedSelected);
        }
      }

      console.log('Family member updated successfully');
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFamilyMember = async (memberId: string) => {
    if (!user) throw new Error('User not authenticated');

    const memberToDelete = members.find(m => m.id === memberId);
    if (memberToDelete?.isMainProfile) {
      throw new Error('Cannot delete main profile');
    }

    setIsLoading(true);
    try {
      const updatedMembers = members.filter(member => member.id !== memberId);
      await saveFamilyMembers(updatedMembers);

      // Clear selection if deleted member was selected
      if (selectedMember?.id === memberId) {
        const mainProfile = updatedMembers.find(member => member.isMainProfile);
        setSelectedMember(mainProfile || null);
      }

      console.log('Family member deleted successfully');
    } catch (error) {
      console.error('Error deleting family member:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectMember = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  const refreshMembers = async () => {
    await loadFamilyMembers();
  };

  const generateEmergencyQR = async (memberId: string): Promise<string> => {
    const member = members.find(m => m.id === memberId);
    if (!member) throw new Error('Member not found');

    // Create emergency data object
    const emergencyData = {
      name: member.name,
      age: member.age,
      bloodGroup: member.bloodGroup,
      chronicConditions: member.chronicConditions,
      emergencyContact: member.emergencyContact,
      timestamp: new Date().toISOString(),
    };

    // For demo purposes, return a mock QR code data
    return btoa(JSON.stringify(emergencyData)); // Base64 encode for demo
  };

  const value: FamilyContextType = {
    members,
    selectedMember,
    isLoading,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    selectMember,
    refreshMembers,
    generateEmergencyQR,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};
