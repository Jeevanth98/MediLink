import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import firestore from '@react-native-firebase/firestore';
import { MedicalRecord, RecordState, RecordFilter, RecordCategory } from '../types/MedicalRecord';
import { DocumentService } from '../services/DocumentService';
import OCRService from '../services/OCRService';
import { useAuth } from './SimpleAuthContext';
import { useFamily } from './FamilyContext';

interface RecordContextType extends RecordState {
  uploadDocument: (
    document: any,
    title: string,
    description?: string,
    category?: RecordCategory,
    recordDate?: Date
  ) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<MedicalRecord>) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  searchRecords: (query: string) => void;
  filterRecords: (filter: Partial<RecordFilter>) => void;
  clearFilters: () => void;
  selectRecord: (record: MedicalRecord) => void;
  refreshRecords: () => Promise<void>;
  getRecordsByCategory: (category: RecordCategory) => MedicalRecord[];
  getRecordsForMember: (familyMemberId: string) => MedicalRecord[];
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const useRecords = () => {
  const context = useContext(RecordContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordProvider');
  }
  return context;
};

interface RecordProviderProps {
  children: ReactNode;
}

export const RecordProvider: React.FC<RecordProviderProps> = ({ children }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState<RecordFilter>({});

  const { user } = useAuth();
  const { selectedMember } = useFamily();

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [records, filter]);

  const loadRecords = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // For now, we'll create some mock records since we don't have Firebase Storage
      const mockRecords: MedicalRecord[] = [
        {
          id: '1',
          userId: user.id,
          familyMemberId: selectedMember?.id || 'main',
          title: 'Blood Test Results',
          description: 'Complete Blood Count and Lipid Profile',
          category: 'lab_report',
          documentType: 'image',
          fileUrl: 'mock://blood_test_results.jpg',
          fileName: 'blood_test_results.jpg',
          fileSize: 1024000,
          mimeType: 'image/jpeg',
          uploadDate: new Date(),
          recordDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          extractedText: 'LABORATORY REPORT\nMediLab Testing Center\nHemoglobin: 14.2 g/dL\nCholesterol: 195 mg/dL',
          extractedData: {
            doctorName: 'Dr. Sarah Johnson',
            hospitalName: 'MediLab Testing Center',
            testType: 'Blood Test',
            testResults: [
              {
                testName: 'Hemoglobin',
                value: '14.2',
                unit: 'g/dL',
                referenceRange: '13.5-17.5',
                isAbnormal: false
              },
              {
                testName: 'LDL Cholesterol',
                value: '120',
                unit: 'mg/dL',
                referenceRange: '<100',
                isAbnormal: true
              }
            ]
          },
          tags: ['blood-test', 'cholesterol', 'dr-sarah-johnson'],
          isEmergencyRecord: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: user.id,
          familyMemberId: selectedMember?.id || 'main',
          title: 'Prescription - Diabetes Medication',
          description: 'Monthly diabetes medication prescription',
          category: 'prescription',
          documentType: 'image',
          fileUrl: 'mock://prescription_diabetes.jpg',
          fileName: 'prescription_diabetes.jpg',
          fileSize: 800000,
          mimeType: 'image/jpeg',
          uploadDate: new Date(),
          recordDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          extractedText: 'Dr. Michael Brown\nMetformin 500mg - Take twice daily\nLisinopril 10mg - Take once daily',
          extractedData: {
            doctorName: 'Dr. Michael Brown',
            hospitalName: 'City Medical Center',
            medications: ['Metformin 500mg - Take twice daily', 'Lisinopril 10mg - Take once daily'],
            nextAppointment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          tags: ['prescription', 'diabetes', 'metformin', 'dr-michael-brown'],
          isEmergencyRecord: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          userId: user.id,
          familyMemberId: selectedMember?.id || 'main',
          title: 'X-Ray Chest',
          description: 'Routine chest X-ray examination',
          category: 'diagnostic_scan',
          documentType: 'image',
          fileUrl: 'mock://xray_chest.jpg',
          fileName: 'xray_chest.jpg',
          fileSize: 1500000,
          mimeType: 'image/jpeg',
          uploadDate: new Date(),
          recordDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          extractedText: 'RADIOLOGY REPORT\nChest X-Ray PA and Lateral\nNo acute findings\nHeart size normal',
          extractedData: {
            doctorName: 'Dr. Lisa Chen',
            hospitalName: 'Regional Medical Center',
            testType: 'X-Ray',
            diagnosis: 'No acute findings, heart size normal'
          },
          tags: ['x-ray', 'chest', 'radiology', 'dr-lisa-chen'],
          isEmergencyRecord: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setRecords(mockRecords);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (
    document: any,
    title: string,
    description?: string,
    category?: RecordCategory,
    recordDate?: Date
  ) => {
    if (!user || !selectedMember) throw new Error('User or family member not selected');

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload the document
      const uploadResult = await DocumentService.uploadDocument(
        document.uri,
        user.id,
        selectedMember.id,
        setUploadProgress
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }

      const fileUrl = uploadResult.fileUri || '';

      // Extract text using OCR
      const extractedText = await OCRService.extractTextFromImage(document.uri);
      
      // Extract medical data
      const extractedData = await OCRService.extractMedicalData(extractedText);
      
      // Generate tags
      const tags = OCRService.generateTags(extractedText, extractedData);

      // Determine category if not provided
      const finalCategory = category || DocumentService.getCategoryFromFileName(document.name) as RecordCategory;

      // Create record object
      const newRecord: MedicalRecord = {
        id: Date.now().toString(),
        userId: user.id,
        familyMemberId: selectedMember.id,
        title,
        description,
        category: finalCategory,
        documentType: DocumentService.getDocumentType(document.type),
        fileUrl,
        fileName: document.name,
        fileSize: document.size,
        mimeType: document.type,
        uploadDate: new Date(),
        recordDate: recordDate || new Date(),
        extractedText,
        extractedData,
        tags,
        isEmergencyRecord: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to local state
      setRecords(prev => [newRecord, ...prev]);

      // TODO: Save to Firestore when available
      // await firestore()
      //   .collection('medicalRecords')
      //   .doc(newRecord.id)
      //   .set(newRecord);

    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<MedicalRecord>) => {
    try {
      setRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, ...updates, updatedAt: new Date() }
          : record
      ));

      // TODO: Update in Firestore when available
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const record = records.find(r => r.id === recordId);
      if (record) {
        await DocumentService.deleteDocument(record.fileUrl);
        setRecords(prev => prev.filter(r => r.id !== recordId));
        
        if (selectedRecord?.id === recordId) {
          setSelectedRecord(null);
        }
      }

      // TODO: Delete from Firestore when available
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  };

  const searchRecords = (query: string) => {
    setFilter(prev => ({ ...prev, searchQuery: query }));
  };

  const filterRecords = (newFilter: Partial<RecordFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const clearFilters = () => {
    setFilter({});
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Filter by family member
    if (filter.familyMemberId) {
      filtered = filtered.filter(record => record.familyMemberId === filter.familyMemberId);
    }

    // Filter by category
    if (filter.category) {
      filtered = filtered.filter(record => record.category === filter.category);
    }

    // Filter by date range
    if (filter.dateFrom) {
      filtered = filtered.filter(record => record.recordDate >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      filtered = filtered.filter(record => record.recordDate <= filter.dateTo!);
    }

    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(query) ||
        record.description?.toLowerCase().includes(query) ||
        record.extractedText?.toLowerCase().includes(query) ||
        record.tags.some(tag => tag.includes(query))
      );
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(record => 
        filter.tags!.some(tag => record.tags.includes(tag))
      );
    }

    setFilteredRecords(filtered);
  };

  const selectRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
  };

  const refreshRecords = async () => {
    await loadRecords();
  };

  const getRecordsByCategory = (category: RecordCategory) => {
    return records.filter(record => record.category === category);
  };

  const getRecordsForMember = (familyMemberId: string) => {
    return records.filter(record => record.familyMemberId === familyMemberId);
  };

  const value: RecordContextType = {
    records,
    filteredRecords,
    selectedRecord,
    isLoading,
    isUploading,
    uploadProgress,
    filter,
    uploadDocument,
    updateRecord,
    deleteRecord,
    searchRecords,
    filterRecords,
    clearFilters,
    selectRecord,
    refreshRecords,
    getRecordsByCategory,
    getRecordsForMember,
  };

  return (
    <RecordContext.Provider value={value}>
      {children}
    </RecordContext.Provider>
  );
};
