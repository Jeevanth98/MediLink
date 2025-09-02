import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LabTestResult {
  testName: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  status: 'normal' | 'high' | 'low' | 'critical';
  description: string;
}

export interface AIAnalysisResult {
  id: string;
  recordId: string;
  extractedTests: LabTestResult[];
  overallAssessment: string;
  healthInsights: string[];
  recommendations: string[];
  riskFactors: string[];
  createdAt: Date;
}

export class AIAnalysisService {
  // Standard medical reference ranges
  private static readonly REFERENCE_RANGES = {
    'hemoglobin': { min: 12.0, max: 16.0, unit: 'g/dL' },
    'hematocrit': { min: 36.0, max: 46.0, unit: '%' },
    'white blood cells': { min: 4.5, max: 11.0, unit: '10³/µL' },
    'platelets': { min: 150, max: 450, unit: '10³/µL' },
    'glucose': { min: 70, max: 100, unit: 'mg/dL' },
    'cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
    'ldl cholesterol': { min: 0, max: 100, unit: 'mg/dL' },
    'hdl cholesterol': { min: 40, max: 999, unit: 'mg/dL' },
    'triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
    'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'blood urea nitrogen': { min: 7, max: 20, unit: 'mg/dL' },
    'alt': { min: 7, max: 35, unit: 'U/L' },
    'ast': { min: 8, max: 40, unit: 'U/L' },
    'bilirubin': { min: 0.2, max: 1.2, unit: 'mg/dL' },
    'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L' },
    'vitamin d': { min: 30, max: 100, unit: 'ng/mL' },
    'hba1c': { min: 0, max: 5.6, unit: '%' },
  };

  static async analyzeLabReport(extractedText: string, recordId: string): Promise<AIAnalysisResult> {
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract test results from text (mock implementation)
      const extractedTests = this.extractTestResults(extractedText);
      
      // Generate AI analysis
      const analysis = this.generateAnalysis(extractedTests);

      const result: AIAnalysisResult = {
        id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recordId,
        extractedTests,
        overallAssessment: analysis.overallAssessment,
        healthInsights: analysis.healthInsights,
        recommendations: analysis.recommendations,
        riskFactors: analysis.riskFactors,
        createdAt: new Date(),
      };

      return result;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw new Error('Failed to analyze lab report');
    }
  }

  private static extractTestResults(text: string): LabTestResult[] {
    const results: LabTestResult[] = [];
    const lines = text.toLowerCase().split('\n');

    // Mock extraction logic - in real implementation, this would use sophisticated NLP
    const testPatterns = [
      { name: 'hemoglobin', patterns: ['hemoglobin', 'hb'], value: 13.5 },
      { name: 'glucose', patterns: ['glucose', 'blood sugar'], value: 95 },
      { name: 'cholesterol', patterns: ['cholesterol', 'chol'], value: 180 },
      { name: 'creatinine', patterns: ['creatinine', 'creat'], value: 1.0 },
      { name: 'white blood cells', patterns: ['wbc', 'white blood cells'], value: 7.5 },
    ];

    testPatterns.forEach(test => {
      const foundInText = test.patterns.some(pattern => 
        lines.some(line => line.includes(pattern))
      );

      if (foundInText) {
        const refRange = this.REFERENCE_RANGES[test.name as keyof typeof this.REFERENCE_RANGES];
        if (refRange) {
          const status = this.determineStatus(test.value, refRange.min, refRange.max);
          results.push({
            testName: test.name.charAt(0).toUpperCase() + test.name.slice(1),
            value: test.value,
            unit: refRange.unit,
            referenceRange: { min: refRange.min, max: refRange.max },
            status,
            description: this.getStatusDescription(test.name, status, test.value),
          });
        }
      }
    });

    return results;
  }

  private static determineStatus(value: number, min: number, max: number): 'normal' | 'high' | 'low' | 'critical' {
    if (value < min * 0.7 || value > max * 1.5) return 'critical';
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'normal';
  }

  private static getStatusDescription(testName: string, status: string, _value: number): string {
    const descriptions = {
      normal: `${testName} levels are within normal range.`,
      high: `${testName} levels are elevated. Consider dietary modifications and follow-up.`,
      low: `${testName} levels are below normal. May require supplementation or further investigation.`,
      critical: `${testName} levels require immediate medical attention.`,
    };
    return descriptions[status as keyof typeof descriptions] || 'Test result needs evaluation.';
  }

  private static generateAnalysis(tests: LabTestResult[]): {
    overallAssessment: string;
    healthInsights: string[];
    recommendations: string[];
    riskFactors: string[];
  } {
    const abnormalTests = tests.filter(test => test.status !== 'normal');
    const criticalTests = tests.filter(test => test.status === 'critical');

    let overallAssessment = '';
    const healthInsights: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];

    if (criticalTests.length > 0) {
      overallAssessment = 'Your lab results show some critical values that require immediate medical attention.';
      recommendations.push('Schedule an urgent appointment with your healthcare provider.');
    } else if (abnormalTests.length > 0) {
      overallAssessment = 'Your lab results show some values outside the normal range that may need attention.';
      recommendations.push('Discuss these results with your healthcare provider during your next visit.');
    } else {
      overallAssessment = 'Your lab results are within normal ranges. Keep up the good work!';
      recommendations.push('Continue maintaining your current healthy lifestyle.');
    }

    // Generate specific insights based on test results
    tests.forEach(test => {
      if (test.testName.toLowerCase().includes('glucose') && test.status === 'high') {
        healthInsights.push('Elevated glucose levels may indicate prediabetes or diabetes risk.');
        recommendations.push('Consider reducing sugar intake and increasing physical activity.');
        riskFactors.push('Diabetes risk');
      }

      if (test.testName.toLowerCase().includes('cholesterol') && test.status === 'high') {
        healthInsights.push('High cholesterol levels may increase cardiovascular risk.');
        recommendations.push('Consider a heart-healthy diet low in saturated fats.');
        riskFactors.push('Cardiovascular disease risk');
      }

      if (test.testName.toLowerCase().includes('hemoglobin') && test.status === 'low') {
        healthInsights.push('Low hemoglobin may indicate iron deficiency or anemia.');
        recommendations.push('Include iron-rich foods in your diet and consider supplementation.');
        riskFactors.push('Anemia risk');
      }
    });

    if (healthInsights.length === 0) {
      healthInsights.push('Your current lab values suggest good overall health.');
    }

    if (recommendations.length === 1) {
      recommendations.push('Maintain regular health check-ups for ongoing monitoring.');
    }

    return {
      overallAssessment,
      healthInsights,
      recommendations,
      riskFactors,
    };
  }

  static async saveAnalysis(analysis: AIAnalysisResult): Promise<void> {
    try {
      const key = `ai_analyses`;
      const stored = await AsyncStorage.getItem(key);
      const analyses = stored ? JSON.parse(stored) : [];
      analyses.push(analysis);
      await AsyncStorage.setItem(key, JSON.stringify(analyses));
    } catch (error) {
      console.error('Error saving AI analysis:', error);
      throw error;
    }
  }

  static async getAnalysisForRecord(recordId: string): Promise<AIAnalysisResult | null> {
    try {
      const key = `ai_analyses`;
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const analyses: AIAnalysisResult[] = JSON.parse(stored);
      return analyses.find(analysis => analysis.recordId === recordId) || null;
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      return null;
    }
  }

  static async getAllAnalyses(): Promise<AIAnalysisResult[]> {
    try {
      const key = `ai_analyses`;
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return [];

      return JSON.parse(stored).map((analysis: any) => ({
        ...analysis,
        createdAt: new Date(analysis.createdAt),
      }));
    } catch (error) {
      console.error('Error getting all analyses:', error);
      return [];
    }
  }
}
