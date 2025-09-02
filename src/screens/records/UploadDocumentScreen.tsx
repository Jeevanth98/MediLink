import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  SegmentedButtons,
  HelperText,
  Avatar,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { useRecords } from '../../contexts/RecordContext';
import { useFamily } from '../../contexts/FamilyContext';
import { DocumentService } from '../../services/DocumentService';
import { RecordCategory } from '../../types/MedicalRecord';

interface UploadDocumentScreenProps {
  navigation: any;
}

const UploadDocumentScreen: React.FC<UploadDocumentScreenProps> = ({ navigation }) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecordCategory>('other');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { uploadDocument, isUploading, uploadProgress } = useRecords();
  const { selectedMember } = useFamily();

  const categories = [
    { value: 'prescription', label: 'Prescription', icon: 'pill' },
    { value: 'lab_report', label: 'Lab Report', icon: 'test-tube' },
    { value: 'diagnostic_scan', label: 'Scan/X-ray', icon: 'radiobox-marked' },
    { value: 'consultation', label: 'Consultation', icon: 'stethoscope' },
    { value: 'vaccination', label: 'Vaccination', icon: 'needle' },
    { value: 'other', label: 'Other', icon: 'file' },
  ];

  const handleSelectDocument = async () => {
    try {
      const document = await DocumentService.pickDocument();
      if (document) {
        setSelectedDocument(document);
        
        // Auto-suggest title and category based on filename
        const suggestedCategory = DocumentService.getCategoryFromFileName(document.name);
        setCategory(suggestedCategory as RecordCategory);
        
        // Auto-suggest title
        const baseName = document.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const formattedTitle = baseName
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        setTitle(formattedTitle);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!selectedDocument) {
      Alert.alert('Error', 'Please select a document to upload.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the document.');
      return;
    }

    if (!selectedMember) {
      Alert.alert('Error', 'Please select a family member first.');
      return;
    }

    setIsProcessing(true);
    try {
      await uploadDocument(
        selectedDocument,
        title.trim(),
        description.trim() || undefined,
        category,
        new Date(recordDate)
      );

      Alert.alert(
        'Upload Successful',
        'Your medical document has been uploaded and processed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Upload Medical Document
        </Text>
        {selectedMember && (
          <Text variant="bodyMedium" style={styles.memberName}>
            For: {selectedMember.name}
          </Text>
        )}
      </View>

      {/* Document Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Select Document
          </Text>
          
          {!selectedDocument ? (
            <Button
              mode="outlined"
              onPress={handleSelectDocument}
              icon="upload"
              style={styles.selectButton}
            >
              Choose Document
            </Button>
          ) : (
            <View style={styles.documentPreview}>
              <View style={styles.documentInfo}>
                <Avatar.Icon
                  size={50}
                  icon={selectedDocument.type.includes('image') ? 'image' : 'file'}
                  style={styles.documentIcon}
                />
                <View style={styles.documentDetails}>
                  <Text variant="bodyLarge" style={styles.documentName}>
                    {selectedDocument.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.documentSize}>
                    {formatFileSize(selectedDocument.size)}
                  </Text>
                  <Text variant="bodySmall" style={styles.documentType}>
                    {selectedDocument.type}
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  onPress={() => setSelectedDocument(null)}
                  style={styles.removeButton}
                />
              </View>
              
              {selectedDocument.type.includes('image') && (
                <Image
                  source={{ uri: selectedDocument.uri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Document Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Document Details
          </Text>

          <TextInput
            label="Title *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Blood Test Results, Prescription"
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Optional: Add any additional notes or context"
          />

          <Text variant="bodyMedium" style={styles.inputLabel}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                mode={category === cat.value ? 'contained' : 'outlined'}
                onPress={() => setCategory(cat.value as RecordCategory)}
                style={styles.categoryButton}
                icon={cat.icon}
                compact
              >
                {cat.label}
              </Button>
            ))}
          </View>

          <TextInput
            label="Record Date"
            value={recordDate}
            onChangeText={setRecordDate}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
          />
          <HelperText type="info">
            The date when this medical record was created (not upload date)
          </HelperText>
        </Card.Content>
      </Card>

      {/* AI Processing Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Smart Processing 🤖
          </Text>
          <Text variant="bodyMedium" style={styles.aiDescription}>
            After upload, MediLink will automatically:
          </Text>
          <View style={styles.featuresList}>
            <Text variant="bodySmall" style={styles.featureItem}>
              📄 Extract text from images using OCR
            </Text>
            <Text variant="bodySmall" style={styles.featureItem}>
              🏥 Identify doctor names and hospitals
            </Text>
            <Text variant="bodySmall" style={styles.featureItem}>
              💊 Extract medication information
            </Text>
            <Text variant="bodySmall" style={styles.featureItem}>
              🔬 Parse lab test results and values
            </Text>
            <Text variant="bodySmall" style={styles.featureItem}>
              🏷️ Generate relevant tags for easy searching
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Upload Progress */}
      {(isUploading || isProcessing) && (
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.progressText}>
              {isUploading ? 'Uploading document...' : 'Processing with AI...'}
            </Text>
            <ProgressBar 
              progress={isUploading ? uploadProgress / 100 : 0.5} 
              style={styles.progressBar}
              indeterminate={isProcessing}
            />
            {isUploading && (
              <Text variant="bodySmall" style={styles.progressPercentage}>
                {Math.round(uploadProgress)}% complete
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Upload Button */}
      <Button
        mode="contained"
        onPress={handleUpload}
        disabled={!selectedDocument || !title.trim() || isUploading || isProcessing}
        style={styles.uploadButton}
        icon="upload"
      >
        {isUploading || isProcessing ? 'Processing...' : 'Upload Document'}
      </Button>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  memberName: {
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  selectButton: {
    marginVertical: 16,
  },
  documentPreview: {
    marginTop: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    backgroundColor: '#E3F2FD',
  },
  documentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  documentSize: {
    color: '#666',
    marginBottom: 2,
  },
  documentType: {
    color: '#999',
    fontSize: 12,
  },
  removeButton: {
    margin: 0,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  input: {
    marginBottom: 12,
  },
  inputLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    minWidth: 100,
    marginBottom: 8,
  },
  aiDescription: {
    marginBottom: 12,
    color: '#666',
  },
  featuresList: {
    paddingLeft: 8,
  },
  featureItem: {
    marginBottom: 6,
    color: '#666',
    lineHeight: 18,
  },
  progressCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#E3F2FD',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  progressBar: {
    marginBottom: 8,
  },
  progressPercentage: {
    textAlign: 'center',
    color: '#666',
  },
  uploadButton: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default UploadDocumentScreen;
