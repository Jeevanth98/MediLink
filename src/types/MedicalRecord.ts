export interface MedicalRecord {
  id: string;
  userId: string;
  familyMemberId: string;
  title: string;
  description?: string;
  category: RecordCategory;
  documentType: DocumentType;
  fileUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  recordDate: Date;
  extractedText?: string;
  extractedData?: ExtractedMedicalData;
  tags: string[];
  isEmergencyRecord: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractedMedicalData {
  doctorName?: string;
  hospitalName?: string;
  testType?: string;
  diagnosis?: string;
  medications?: string[];
  testResults?: TestResult[];
  vitals?: VitalSigns;
  nextAppointment?: Date;
}

export interface TestResult {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export type RecordCategory = 
  | 'prescription'
  | 'lab_report'
  | 'diagnostic_scan'
  | 'discharge_summary'
  | 'consultation'
  | 'vaccination'
  | 'insurance'
  | 'bill_invoice'
  | 'other';

export type DocumentType = 
  | 'pdf'
  | 'image'
  | 'scan';

export interface RecordFilter {
  familyMemberId?: string;
  category?: RecordCategory;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  tags?: string[];
}

export interface RecordState {
  records: MedicalRecord[];
  filteredRecords: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  filter: RecordFilter;
}
