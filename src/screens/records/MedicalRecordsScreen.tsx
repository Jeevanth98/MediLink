import React, { useState, useEffect } from 'react';
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
  Searchbar,
  FAB,
  Chip,
  Avatar,
  Button,
  ProgressBar,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useRecords } from '../../contexts/RecordContext';
import { useFamily } from '../../contexts/FamilyContext';
import { MedicalRecord, RecordCategory } from '../../types/MedicalRecord';

interface MedicalRecordsScreenProps {
  navigation: any;
}

const MedicalRecordsScreen: React.FC<MedicalRecordsScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecordCategory | 'all'>('all');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'name'>('date');

  const {
    filteredRecords,
    isLoading,
    isUploading,
    uploadProgress,
    searchRecords,
    filterRecords,
    clearFilters,
    selectRecord,
    refreshRecords,
  } = useRecords();

  const { selectedMember, members } = useFamily();

  useEffect(() => {
    searchRecords(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      filterRecords({ category: undefined });
    } else {
      filterRecords({ category: selectedCategory });
    }
  }, [selectedCategory]);

  const getCategoryIcon = (category: RecordCategory): string => {
    const icons = {
      prescription: 'pill',
      lab_report: 'test-tube',
      diagnostic_scan: 'radiobox-marked',
      discharge_summary: 'file-document',
      consultation: 'stethoscope',
      vaccination: 'needle',
      insurance: 'shield-account',
      bill_invoice: 'receipt',
      other: 'file',
    };
    return icons[category] || 'file';
  };

  const getCategoryColor = (category: RecordCategory): string => {
    const colors = {
      prescription: '#4CAF50',
      lab_report: '#2196F3',
      diagnostic_scan: '#FF9800',
      discharge_summary: '#9C27B0',
      consultation: '#F44336',
      vaccination: '#00BCD4',
      insurance: '#795548',
      bill_invoice: '#607D8B',
      other: '#9E9E9E',
    };
    return colors[category] || '#9E9E9E';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRecordPress = (record: MedicalRecord) => {
    selectRecord(record);
    navigation.navigate('RecordDetails', { recordId: record.id });
  };

  const handleUploadPress = () => {
    navigation.navigate('UploadDocument');
  };

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.recordDate.getTime() - a.recordDate.getTime();
      case 'category':
        return a.category.localeCompare(b.category);
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const categories: Array<{ key: RecordCategory | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'prescription', label: 'Prescriptions' },
    { key: 'lab_report', label: 'Lab Reports' },
    { key: 'diagnostic_scan', label: 'Scans' },
    { key: 'consultation', label: 'Consultations' },
    { key: 'vaccination', label: 'Vaccines' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Medical Records
        </Text>
        {selectedMember && (
          <Text variant="bodyMedium" style={styles.memberName}>
            {selectedMember.name}
          </Text>
        )}
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search records, doctors, conditions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <Chip
                key={category.key}
                mode={selectedCategory === category.key ? 'flat' : 'outlined'}
                selected={selectedCategory === category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={styles.categoryChip}
              >
                {category.label}
              </Chip>
            ))}
          </ScrollView>
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <IconButton
                icon="sort"
                onPress={() => setSortMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('date');
                setSortMenuVisible(false);
              }}
              title="Sort by Date"
              leadingIcon="calendar"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('category');
                setSortMenuVisible(false);
              }}
              title="Sort by Category"
              leadingIcon="tag"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('name');
                setSortMenuVisible(false);
              }}
              title="Sort by Name"
              leadingIcon="alphabetical"
            />
          </Menu>
        </View>
      </View>

      {/* Upload Progress */}
      {isUploading && (
        <Card style={styles.uploadProgressCard}>
          <Card.Content>
            <Text variant="bodyMedium">Uploading document...</Text>
            <ProgressBar progress={uploadProgress / 100} style={styles.progressBar} />
            <Text variant="bodySmall">{Math.round(uploadProgress)}% complete</Text>
          </Card.Content>
        </Card>
      )}

      {/* Records List */}
      <ScrollView style={styles.recordsList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text variant="bodyLarge">Loading records...</Text>
          </View>
        ) : sortedRecords.length > 0 ? (
          sortedRecords.map((record, index) => (
            <Card
              key={record.id}
              style={styles.recordCard}
              onPress={() => handleRecordPress(record)}
            >
              <Card.Content>
                <View style={styles.recordHeader}>
                  <Avatar.Icon
                    size={40}
                    icon={getCategoryIcon(record.category)}
                    style={{ backgroundColor: getCategoryColor(record.category) }}
                  />
                  <View style={styles.recordInfo}>
                    <Text variant="titleMedium" style={styles.recordTitle}>
                      {record.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.recordDate}>
                      {formatDate(record.recordDate)}
                    </Text>
                    {record.description && (
                      <Text variant="bodySmall" style={styles.recordDescription}>
                        {record.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.recordMeta}>
                    <Chip compact mode="outlined" style={styles.categoryChipSmall}>
                      {record.category.replace('_', ' ')}
                    </Chip>
                    <Text variant="bodySmall" style={styles.fileSize}>
                      {formatFileSize(record.fileSize)}
                    </Text>
                  </View>
                </View>

                {/* Doctor and Hospital Info */}
                {(record.extractedData?.doctorName || record.extractedData?.hospitalName) && (
                  <View style={styles.doctorInfo}>
                    {record.extractedData.doctorName && (
                      <Text variant="bodySmall" style={styles.doctorName}>
                        👨‍⚕️ {record.extractedData.doctorName}
                      </Text>
                    )}
                    {record.extractedData.hospitalName && (
                      <Text variant="bodySmall" style={styles.hospitalName}>
                        🏥 {record.extractedData.hospitalName}
                      </Text>
                    )}
                  </View>
                )}

                {/* Tags */}
                {record.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {record.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Chip
                        key={tagIndex}
                        compact
                        mode="outlined"
                        style={styles.tag}
                      >
                        {tag}
                      </Chip>
                    ))}
                    {record.tags.length > 3 && (
                      <Text variant="bodySmall" style={styles.moreTags}>
                        +{record.tags.length - 3} more
                      </Text>
                    )}
                  </View>
                )}

                {/* Abnormal Results Warning */}
                {record.extractedData?.testResults?.some(result => result.isAbnormal) && (
                  <View style={styles.warningContainer}>
                    <Text variant="bodySmall" style={styles.warningText}>
                      ⚠️ Contains abnormal test results
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Avatar.Icon
              size={80}
              icon="file-plus"
              style={styles.emptyIcon}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Medical Records
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Upload your first medical document to get started with organized health record management.
            </Text>
            <Button
              mode="contained"
              onPress={handleUploadPress}
              style={styles.emptyButton}
              icon="upload"
            >
              Upload Document
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleUploadPress}
        label="Upload"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  memberName: {
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchbar: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesScroll: {
    flex: 1,
  },
  categoryChip: {
    marginRight: 8,
  },
  uploadProgressCard: {
    margin: 16,
    elevation: 4,
    backgroundColor: '#E3F2FD',
  },
  progressBar: {
    marginVertical: 8,
  },
  recordsList: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  recordCard: {
    marginBottom: 12,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recordTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordDate: {
    color: '#666',
    marginBottom: 4,
  },
  recordDescription: {
    color: '#888',
  },
  recordMeta: {
    alignItems: 'flex-end',
  },
  categoryChipSmall: {
    marginBottom: 4,
  },
  fileSize: {
    color: '#999',
    fontSize: 12,
  },
  doctorInfo: {
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  doctorName: {
    color: '#666',
    marginBottom: 4,
  },
  hospitalName: {
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 6,
    marginBottom: 4,
  },
  moreTags: {
    color: '#999',
    fontStyle: 'italic',
  },
  warningContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default MedicalRecordsScreen;
