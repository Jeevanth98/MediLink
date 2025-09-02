import { RecordCategory, DocumentType } from '../types/MedicalRecord';
import ImagePicker from 'react-native-image-crop-picker';
import { Alert } from 'react-native';

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
  width?: number;
  height?: number;
}

export interface DocumentPickOptions {
  multiple: boolean;
  maxFiles?: number;
  documentType?: RecordCategory;
}

export class DocumentService {
  static async showImagePickerOptions(): Promise<'camera' | 'gallery' | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Document Source',
        'Choose how you want to add your document',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Gallery', onPress: () => resolve('gallery') },
          { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  static async pickDocumentFromCamera(enableCrop: boolean = true): Promise<DocumentPickResult[]> {
    try {
      const images = await ImagePicker.openCamera({
        multiple: false,
        width: enableCrop ? 800 : undefined,
        height: enableCrop ? 1200 : undefined,
        cropping: enableCrop,
        cropperToolbarTitle: 'Edit Document',
        cropperCircleOverlay: false,
        freeStyleCropEnabled: true,
        showCropGuidelines: true,
        mediaType: 'photo',
        includeBase64: false,
        compressImageQuality: 0.8,
      });

      const imageArray = Array.isArray(images) ? images : [images];
      
      return imageArray.map((image: any) => ({
        name: `camera_doc_${Date.now()}.jpg`,
        type: image.mime || 'image/jpeg',
        uri: image.path,
        size: image.size || 0,
        width: image.width,
        height: image.height,
      }));
    } catch (error) {
      console.error('Error picking from camera:', error);
      throw new Error('Failed to capture image from camera');
    }
  }

  static async pickDocumentFromGallery(multiple: boolean = true): Promise<DocumentPickResult[]> {
    try {
      const images = await ImagePicker.openPicker({
        multiple: multiple,
        maxFiles: multiple ? 5 : 1,
        mediaType: 'photo',
        includeBase64: false,
        compressImageQuality: 0.8,
        cropping: false, // Gallery images can be cropped later if needed
      });

      const imageArray = Array.isArray(images) ? images : [images];
      
      return imageArray.map((image: any, index: number) => ({
        name: `gallery_doc_${Date.now()}_${index}.jpg`,
        type: image.mime || 'image/jpeg',
        uri: image.path,
        size: image.size || 0,
        width: image.width,
        height: image.height,
      }));
    } catch (error) {
      console.error('Error picking from gallery:', error);
      throw new Error('Failed to select images from gallery');
    }
  }

  static async cropImage(imagePath: string): Promise<string> {
    try {
      const croppedImage = await ImagePicker.openCropper({
        path: imagePath,
        width: 800,
        height: 1200,
        mediaType: 'photo',
        cropperToolbarTitle: 'Edit Document',
        cropperCircleOverlay: false,
        freeStyleCropEnabled: true,
        showCropGuidelines: true,
        compressImageQuality: 0.8,
      });

      return (croppedImage as any).path;
    } catch (error) {
      console.error('Error cropping image:', error);
      throw new Error('Failed to crop image');
    }
  }

  static async pickDocument(options: DocumentPickOptions = { multiple: false }): Promise<DocumentPickResult[]> {
    try {
      const source = await this.showImagePickerOptions();
      if (!source) return [];

      if (source === 'camera') {
        return await this.pickDocumentFromCamera(true);
      } else {
        return await this.pickDocumentFromGallery(options.multiple);
      }
    } catch (error) {
      console.error('Error in pickDocument:', error);
      throw error;
    }
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