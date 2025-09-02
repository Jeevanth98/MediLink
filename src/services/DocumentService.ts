import { RecordCategory, DocumentType } from '../types/MedicalRecord';

export interface DocumentUploadResult {
  success: boolean;
  message: string;
  fileUri?: string;
  extractedText?: string;
  error?: string;
}

export interface DocumentPickResult {
  name: string;
  type: string;
  uri: string;
  size: number;
}

export class DocumentService {
  static async pickDocument(): Promise<DocumentPickResult> {
    // For demo purposes, return a mock document
    return {
      name: 'lab_report.pdf',
      type: 'application/pdf',
      uri: 'demo://document/lab_report.pdf',
      size: 1024000,
    };
  }

  static async uploadDocument(
    uri: string,
    userId: string,
    memberId: string,
    progressCallback?: (progress: number) => void
  ): Promise<DocumentUploadResult> {
    try {
      // Simulate upload progress
      if (progressCallback) {
        for (let i = 0; i <= 100; i += 20) {
          progressCallback(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // For demo purposes, simulate a successful upload
      return {
        success: true,
        message: 'Document uploaded successfully',
        fileUri: `demo://uploaded/${userId}/${memberId}/${Date.now()}`,
        extractedText: 'Demo: OCR text extraction would happen here',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static getCategoryFromFileName(fileName: string): RecordCategory {
    const name = fileName.toLowerCase();
    
    if (name.includes('lab') || name.includes('blood') || name.includes('test')) {
      return 'lab_report';
    }
    if (name.includes('prescription') || name.includes('rx') || name.includes('medicine')) {
      return 'prescription';
    }
    if (name.includes('xray') || name.includes('scan') || name.includes('mri') || name.includes('ct')) {
      return 'diagnostic_scan';
    }
    if (name.includes('discharge') || name.includes('summary')) {
      return 'discharge_summary';
    }
    if (name.includes('vaccine') || name.includes('immunization')) {
      return 'vaccination';
    }
    if (name.includes('consultation') || name.includes('visit')) {
      return 'consultation';
    }
    if (name.includes('insurance')) {
      return 'insurance';
    }
    if (name.includes('bill') || name.includes('invoice')) {
      return 'bill_invoice';
    }
    
    return 'other';
  }

  static getDocumentType(mimeType: string): DocumentType {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    return 'scan';
  }

  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // For demo purposes, simulate successful deletion
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  static async getDocumentUrl(documentId: string): Promise<string | null> {
    try {
      // For demo purposes, return a placeholder URL
      return `demo://document/${documentId}`;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }
}