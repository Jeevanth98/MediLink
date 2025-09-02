import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Chip,
  List,
  ActivityIndicator,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AIAnalysisService, AIAnalysisResult, LabTestResult } from '../../services/AIAnalysisService';
import { useFamily } from '../../contexts/FamilyContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AIReportsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface AIReportsScreenProps {
  navigation: AIReportsScreenNavigationProp;
}

const AIReportsScreen: React.FC<AIReportsScreenProps> = ({ navigation }) => {
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { } = useFamily();

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      const allAnalyses = await AIAnalysisService.getAllAnalyses();
      setAnalyses(allAnalyses);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'high': return '#FF9800';
      case 'low': return '#2196F3';
      case 'critical': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'normal': return 'check-circle';
      case 'high': return 'arrow-up-circle';
      case 'low': return 'arrow-down-circle';
      case 'critical': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const renderTestResult = (test: LabTestResult, index: number) => (
    <Card key={index} style={[styles.testCard, { borderLeftColor: getStatusColor(test.status) }]}>
      <Card.Content>
        <View style={styles.testHeader}>
          <Text variant="titleMedium" style={styles.testName}>
            {test.testName}
          </Text>
          <Chip
            icon={getStatusIcon(test.status)}
            style={[styles.statusChip, { backgroundColor: getStatusColor(test.status) + '20' }]}
            textStyle={{ color: getStatusColor(test.status) }}
          >
            {test.status.toUpperCase()}
          </Chip>
        </View>
        
        <View style={styles.testValues}>
          <Text variant="headlineSmall" style={styles.testValue}>
            {test.value} {test.unit}
          </Text>
          <Text variant="bodySmall" style={styles.referenceRange}>
            Normal: {test.referenceRange.min}-{test.referenceRange.max} {test.unit}
          </Text>
        </View>
        
        <Text variant="bodyMedium" style={styles.testDescription}>
          {test.description}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderAnalysisOverview = (analysis: AIAnalysisResult) => (
    <Card style={styles.analysisCard} onPress={() => setSelectedAnalysis(analysis)}>
      <Card.Content>
        <View style={styles.analysisHeader}>
          <Avatar.Icon size={40} icon="chart-line" style={styles.analysisIcon} />
          <View style={styles.analysisInfo}>
            <Text variant="titleMedium" style={styles.analysisTitle}>
              Lab Analysis Report
            </Text>
            <Text variant="bodySmall" style={styles.analysisDate}>
              {analysis.createdAt.toLocaleDateString()} {analysis.createdAt.toLocaleTimeString()}
            </Text>
          </View>
          <Avatar.Icon size={24} icon="chevron-right" style={styles.chevronIcon} />
        </View>
        
        <Text variant="bodyMedium" style={styles.analysisPreview}>
          {analysis.overallAssessment.substring(0, 100)}...
        </Text>
        
        <View style={styles.testSummary}>
          <Chip icon="test-tube" style={styles.summaryChip}>
            {analysis.extractedTests.length} Tests
          </Chip>
          <Chip 
            icon="lightbulb-outline" 
            style={styles.summaryChip}
            textStyle={{ color: '#FF9800' }}
          >
            {analysis.healthInsights.length} Insights
          </Chip>
          {analysis.riskFactors.length > 0 && (
            <Chip 
              icon="alert" 
              style={[styles.summaryChip, { backgroundColor: '#FFE0E0' }]}
              textStyle={{ color: '#F44336' }}
            >
              {analysis.riskFactors.length} Risk Factors
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderDetailedAnalysis = (analysis: AIAnalysisResult) => (
    <ScrollView style={styles.detailContainer}>
      {/* Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.detailHeader}>
            <Button
              mode="text"
              onPress={() => setSelectedAnalysis(null)}
              icon="arrow-left"
              style={styles.backButton}
            >
              Back to Reports
            </Button>
          </View>
          
          <Text variant="headlineSmall" style={styles.detailTitle}>
            🤖 AI Lab Analysis Report
          </Text>
          <Text variant="bodyMedium" style={styles.detailDate}>
            Generated on {analysis.createdAt.toLocaleDateString()} at {analysis.createdAt.toLocaleTimeString()}
          </Text>
        </Card.Content>
      </Card>

      {/* Overall Assessment */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            📊 Overall Assessment
          </Text>
          <Text variant="bodyLarge" style={styles.assessmentText}>
            {analysis.overallAssessment}
          </Text>
        </Card.Content>
      </Card>

      {/* Test Results */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🧪 Test Results
          </Text>
        </Card.Content>
      </Card>
      
      {analysis.extractedTests.map((test, index) => renderTestResult(test, index))}

      {/* Health Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            💡 Health Insights
          </Text>
          {analysis.healthInsights.map((insight, index) => (
            <List.Item
              key={index}
              title={insight}
              left={() => <Avatar.Icon size={32} icon="lightbulb" style={styles.insightIcon} />}
              titleNumberOfLines={3}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Recommendations */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            📋 Recommendations
          </Text>
          {analysis.recommendations.map((recommendation, index) => (
            <List.Item
              key={index}
              title={recommendation}
              left={() => <Avatar.Icon size={32} icon="clipboard-list" style={styles.recommendationIcon} />}
              titleNumberOfLines={3}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Risk Factors */}
      {analysis.riskFactors.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: '#F44336' }]}>
              ⚠️ Risk Factors
            </Text>
            {analysis.riskFactors.map((risk, index) => (
              <List.Item
                key={index}
                title={risk}
                left={() => <Avatar.Icon size={32} icon="alert" style={styles.riskIcon} />}
                titleNumberOfLines={2}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading AI Reports...
        </Text>
      </View>
    );
  }

  if (selectedAnalysis) {
    return renderDetailedAnalysis(selectedAnalysis);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              🤖 AI Lab Report Analysis
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Get instant insights from your lab reports using AI
            </Text>
          </Card.Content>
        </Card>

        {analyses.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Avatar.Icon size={80} icon="chart-line" style={styles.emptyIcon} />
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No AI Reports Yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Upload a lab report and get instant AI-powered analysis with health insights and recommendations.
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('UploadDocument' as any)}
                style={styles.uploadButton}
                icon="upload"
              >
                Upload Lab Report
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Text variant="titleMedium" style={styles.reportsCount}>
              {analyses.length} AI Report(s) Available
            </Text>
            
            {analyses.map((analysis) => (
              <View key={analysis.id}>
                {renderAnalysisOverview(analysis)}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  reportsCount: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#666',
  },
  analysisCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisIcon: {
    backgroundColor: '#E3F2FD',
  },
  analysisInfo: {
    flex: 1,
    marginLeft: 12,
  },
  analysisTitle: {
    fontWeight: 'bold',
  },
  analysisDate: {
    color: '#666',
    marginTop: 4,
  },
  chevronIcon: {
    backgroundColor: 'transparent',
  },
  analysisPreview: {
    marginBottom: 12,
    color: '#666',
  },
  testSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    backgroundColor: '#E3F2FD',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  uploadButton: {
    minWidth: 200,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  detailHeader: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  detailTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailDate: {
    color: '#666',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  assessmentText: {
    lineHeight: 24,
    color: '#333',
  },
  testCard: {
    margin: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testName: {
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  testValues: {
    marginBottom: 12,
  },
  testValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  referenceRange: {
    color: '#666',
    marginTop: 4,
  },
  testDescription: {
    color: '#666',
    lineHeight: 20,
  },
  insightIcon: {
    backgroundColor: '#FFF3E0',
  },
  recommendationIcon: {
    backgroundColor: '#E8F5E8',
  },
  riskIcon: {
    backgroundColor: '#FFEBEE',
  },
  bottomPadding: {
    height: 32,
  },
});

export default AIReportsScreen;
