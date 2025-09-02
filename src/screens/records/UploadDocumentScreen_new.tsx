import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
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
  Menu,
  Divider,
  List,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRecords } from '../../contexts/RecordContext';
import { useFamily } from '../../contexts/FamilyContext';
import { DocumentService, DocumentPickResult } from '../../services/DocumentService';
import { AIAnalysisService } from '../../services/AIAnalysisService';
import { RecordCategory } from '../../types/MedicalRecord';
import { RootStackParamList } from '../../navigation/AppNavigator';

type UploadDocumentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UploadDocument'
>;

interface UploadDocumentScreenProps {
  navigation: UploadDocumentScreenNavigationProp;
}

const UploadDocumentScreen: React.FC<UploadDocumentScreenProps> = ({ navigation }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentPickResult[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecordCategory>('other');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { uploadDocument, isUploading, uploadProgress } = useRecords();
  const { selectedMember } = useFamily();

  const categories = [
    { value: 'prescription', label: 'Prescription', icon: 'pill' },
    { value: 'lab_report', label: 'Lab Report', icon: 'test-tube' },
    { value: 'diagnostic_scan', label: 'Scan/X-ray', icon: 'radiobox-marked' },
    { value: 'consultation', label: 'Consultation', icon: 'stethoscope' },
    { value: 'vaccination', label: 'Vaccination', icon: 'needle' },
    { value: 'discharge_summary', label: 'Discharge Summary', icon: 'file-document' },
    { value: 'insurance', label: 'Insurance', icon: 'shield' },
    { value: 'bill_invoice', label: 'Bill/Invoice', icon: 'receipt' },
    { value: 'other', label: 'Other', icon: 'file' },
  ];

  const handleSelectDocument = async () => {
    try {
      setIsProcessing(true);
      const documents = await DocumentService.pickDocument({ multiple: true, maxFiles: 5 });
      
      if (documents.length > 0) {
        setSelectedDocuments(documents);
        
        // Auto-suggest category based on first document
        const suggestedCategory = DocumentService.getCategoryFromFileName(documents[0].name);
        setCategory(suggestedCategory);
        
        // Auto-generate title based on first document name
        const baseName = documents[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
        const formattedTitle = baseName
          .replace(/[_-]/g, ' ')
          .trim()
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        setTitle(formattedTitle);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document. Please try again.');
      console.error('Error selecting document:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = selectedDocuments.filter((_, i) => i !== index);
    setSelectedDocuments(updatedDocuments);
    
    if (updatedDocuments.length === 0) {
      setTitle('');
      setCategory('other');
    }
  };

  const handleUpload = async () => {
    if (selectedDocuments.length === 0) {
      Alert.alert('Error', 'Please select at least one document to upload.');
      return;
    }

    if (!selectedMember) {
      Alert.alert('Error', 'Please select a family member first.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the document.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Upload each document
      for (let i = 0; i < selectedDocuments.length; i++) {
        const document = selectedDocuments[i];
        const documentTitle = selectedDocuments.length > 1 ? `${title} (${i + 1})` : title;
        
        await uploadDocument(
          document,
          documentTitle,
          description,
          category,
          new Date(recordDate)
        );

        // If it's a lab report, trigger AI analysis
        if (category === 'lab_report') {
          await performAIAnalysis(document);
        }
      }

      Alert.alert(
        'Success',
        `${selectedDocuments.length} document(s) uploaded successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const performAIAnalysis = async (document: DocumentPickResult) => {
    try {
      setIsAnalyzing(true);
      
      // Mock OCR text extraction for demo
      const extractedText = `Hemoglobin: 13.5 g/dL\nGlucose: 95 mg/dL\nCholesterol: 180 mg/dL\nCreatinine: 1.0 mg/dL\nWhite Blood Cells: 7.5 10³/µL`;
      
      // Perform AI analysis
      const analysis = await AIAnalysisService.analyzeLabReport(extractedText, `record-${Date.now()}`);
      
      // Save analysis
      await AIAnalysisService.saveAnalysis(analysis);
      
      Alert.alert(
        '🤖 AI Analysis Complete',
        'Your lab report has been analyzed! You can view the insights in the AI Reports section.',
        [{ text: 'View Analysis', onPress: () => navigation.navigate('Reports' as any) }]
      );
    } catch (error) {
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category?.icon || 'file';
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category?.label || 'Other';
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            📄 Document Details
          </Text>

          {/* Document Type Selection */}
          <View style={styles.inputGroup}>
            <Text variant="titleSmall" style={styles.label}>Document Type *</Text>
            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowCategoryMenu(true)}
                  icon={getCategoryIcon(category)}
                  style={styles.categoryButton}
                >
                  {getCategoryLabel(category)}
                </Button>
              }
            >
              {categories.map((cat) => (
                <Menu.Item
                  key={cat.value}
                  leadingIcon={cat.icon}
                  onPress={() => {
                    setCategory(cat.value as RecordCategory);
                    setShowCategoryMenu(false);
                  }}
                  title={cat.label}
                />
              ))}
            </Menu>
            {category === 'lab_report' && (
              <HelperText type="info">
                🤖 AI analysis will be performed automatically for lab reports
              </HelperText>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              placeholder="Enter document title"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Add any notes or description"
            />
          </View>

          {/* Record Date */}
          <View style={styles.inputGroup}>
            <TextInput
              label="Record Date"
              value={recordDate}
              onChangeText={setRecordDate}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Document Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            📎 Select Documents
          </Text>

          {selectedDocuments.length === 0 ? (
            <View style={styles.documentSelector}>
              <Avatar.Icon size={64} icon="camera" style={styles.uploadIcon} />
              <Text variant="bodyLarge" style={styles.uploadText}>
                Take a photo or select from gallery
              </Text>
              <Text variant="bodyMedium" style={styles.uploadSubtext}>
                You can select multiple documents at once
              </Text>
              
              <Button
                mode="contained"
                onPress={handleSelectDocument}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.selectButton}
                icon="camera"
              >
                {isProcessing ? 'Processing...' : 'Select Documents'}
              </Button>
            </View>
          ) : (
            <View>
              <Text variant="bodyMedium" style={styles.documentCount}>
                {selectedDocuments.length} document(s) selected
              </Text>
              
              {selectedDocuments.map((document, index) => (
                <Card key={index} style={styles.documentCard}>
                  <Card.Content>
                    <View style={styles.documentInfo}>
                      <Avatar.Icon
                        size={40}
                        icon={document.type.includes('image') ? 'image' : 'file'}
                        style={styles.documentIcon}
                      />
                      <View style={styles.documentDetails}>
                        <Text variant="bodyLarge" style={styles.documentName}>
                          {document.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.documentSize}>
                          {formatFileSize(document.size)} • {document.type}
                        </Text>
                      </View>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => handleRemoveDocument(index)}
                      />
                    </View>
                    
                    {document.type.includes('image') && (
                      <Image
                        source={{ uri: document.uri }}
                        style={styles.documentPreview}
                        resizeMode="cover"
                      />
                    )}
                  </Card.Content>
                </Card>
              ))}

              <Button
                mode="outlined"
                onPress={handleSelectDocument}
                style={styles.addMoreButton}
                icon="plus"
              >
                Add More Documents
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Family Member Info */}
      {selectedMember && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              👤 Family Member
            </Text>
            <List.Item
              title={selectedMember.name}
              description={`${selectedMember.age} years • ${selectedMember.gender}`}
              left={() => <Avatar.Text size={40} label={selectedMember.name.charAt(0)} />}
            />
          </Card.Content>
        </Card>
      )}

      {/* Upload Progress */}
      {(isUploading || isAnalyzing) && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.progressTitle}>
              {isAnalyzing ? '🤖 Analyzing with AI...' : '📤 Uploading...'}
            </Text>
            <ProgressBar progress={uploadProgress / 100} style={styles.progressBar} />
            <Text variant="bodySmall" style={styles.progressText}>
              {isAnalyzing ? 'AI is analyzing your lab report...' : `${Math.round(uploadProgress)}% complete`}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Upload Button */}
      <View style={styles.uploadButtonContainer}>
        <Button
          mode="contained"
          onPress={handleUpload}
          loading={isUploading || isProcessing}
          disabled={selectedDocuments.length === 0 || !title.trim() || isUploading || isProcessing}
          style={styles.uploadButton}
          icon="upload"
        >
          {isUploading || isProcessing ? 'Uploading...' : `Upload ${selectedDocuments.length} Document(s)`}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  categoryButton: {
    justifyContent: 'flex-start',
  },
  documentSelector: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  uploadIcon: {
    backgroundColor: '#E3F2FD',
    marginBottom: 16,
  },
  uploadText: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  selectButton: {
    minWidth: 200,
  },
  documentCount: {
    marginBottom: 16,
    color: '#666',
  },
  documentCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
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
  },
  documentSize: {
    color: '#666',
    marginTop: 4,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  addMoreButton: {
    marginTop: 16,
  },
  progressTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
  },
  uploadButtonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  uploadButton: {
    paddingVertical: 8,
  },
});

export default UploadDocumentScreen;
