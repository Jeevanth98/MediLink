/**
 * Lab Analysis Service - Clean Rule-Based Medical Report Analysis
 * Focuses on Lab Tests with comprehensive parameter detection
 */

class LabAnalysisService {
  
  /**
   * Main analysis function for lab reports
   */
  static analyzeLabReport(extractedText) {
    const text = extractedText.toLowerCase();
    
    // Initialize result structure
    const result = {
      totalTests: 0,
      normalCount: 0,
      abnormalCount: 0,
      normalResults: [],
      criticalConcerns: [],
      highConcerns: [],
      moderateConcerns: [],
      mildConcerns: [],
      immediateActions: [],
      lifestyleRecommendations: [],
      dietaryAdvice: [],
      followUpAdvice: []
    };

    // Analyze all test parameters
    this.analyzeBloodTests(text, result);
    this.analyzeLipidProfile(text, result);
    this.analyzeDiabetesMarkers(text, result);
    this.analyzeLiverFunction(text, result);
    this.analyzeKidneyFunction(text, result);
    this.analyzeThyroidFunction(text, result);
    this.analyzeVitamins(text, result);
    this.analyzeUrineTests(text, result);

    // Generate recommendations based on findings
    this.generateRecommendations(result);

    return result;
  }

  /**
   * Blood Tests Analysis
   */
  static analyzeBloodTests(text, result) {
    const tests = {
      hemoglobin: {
        patterns: [
          /hemoglobin[:\s]+(\d+\.?\d*)\s*(?:g\/dl|g\/l)?/i,
          /hb[:\s]+(\d+\.?\d*)\s*(?:g\/dl|g\/l)?/i
        ],
        normal: { min: 12.0, max: 17.5, unit: 'g/dL' },
        name: 'Hemoglobin',
        critical: { min: 7, max: 20 },
        lowMsg: 'Anemia detected',
        highMsg: 'Polycythemia detected',
        lowSeverity: 'high',
        highSeverity: 'moderate'
      },
      wbc: {
        patterns: [
          /wbc[:\s]+count[:\s]*(\d+,?\d*)\s*(?:\/mm|cells)?/i,
          /white\s+blood\s+cell[:\s]+(\d+,?\d*)/i,
          /leukocyte[:\s]+count[:\s]*(\d+,?\d*)/i
        ],
        normal: { min: 4000, max: 11000, unit: '/mm³' },
        name: 'White Blood Cell Count',
        critical: { min: 1000, max: 25000 },
        lowMsg: 'Leukopenia - Low immune defense',
        highMsg: 'Leukocytosis - Possible infection',
        lowSeverity: 'high',
        highSeverity: 'high'
      },
      rbc: {
        patterns: [
          /rbc[:\s]+count[:\s]*(\d+\.?\d*)\s*(?:million)?/i,
          /red\s+blood\s+cell[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 4.5, max: 5.9, unit: 'million/mm³' },
        name: 'Red Blood Cell Count',
        lowMsg: 'Low RBC - Anemia risk',
        highMsg: 'High RBC - Polycythemia',
        lowSeverity: 'moderate',
        highSeverity: 'moderate'
      },
      platelet: {
        patterns: [
          /platelet[s]?\s+count[:\s]*(\d+,?\d*)\s*(?:\/mm|lakh)?/i,
          /plt[:\s]+(\d+,?\d*)/i
        ],
        normal: { min: 150000, max: 450000, unit: '/mm³' },
        name: 'Platelet Count',
        critical: { min: 50000, max: 1000000 },
        lowMsg: 'Thrombocytopenia - Bleeding risk',
        highMsg: 'Thrombocytosis - Clotting risk',
        lowSeverity: 'critical',
        highSeverity: 'high'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Lipid Profile Analysis
   */
  static analyzeLipidProfile(text, result) {
    const tests = {
      totalCholesterol: {
        patterns: [
          /(?:total\s+)?cholesterol[:\s]+(\d+\.?\d*)\s*(?:mg\/dl|m[og]\/dl)?/i,
          /cholesterol\s+total[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 125, max: 200, unit: 'mg/dL' },
        name: 'Total Cholesterol',
        lowMsg: 'Low cholesterol - Malnutrition risk',
        highMsg: 'High cholesterol - Cardiovascular risk',
        lowSeverity: 'moderate',
        highSeverity: 'high'
      },
      hdl: {
        patterns: [
          /hdl[:\s]+(?:cholesterol[:\s]+)?(\d+\.?\d*)\s*(?:mg\/dl)?/i,
          /hdl[-\s]+c[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 40, max: 60, unit: 'mg/dL' },
        name: 'HDL Cholesterol (Good)',
        lowMsg: 'Low HDL - Heart disease risk',
        highMsg: 'High HDL - Protective (Good)',
        lowSeverity: 'high',
        highSeverity: 'mild' // High HDL is good
      },
      ldl: {
        patterns: [
          /ldl[:\s]+(?:cholesterol[:\s]+)?(\d+\.?\d*)\s*(?:mg\/dl)?/i,
          /ldl[-\s]+c[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 0, max: 100, unit: 'mg/dL' },
        name: 'LDL Cholesterol (Bad)',
        highMsg: 'High LDL - Heart disease risk',
        lowSeverity: 'mild',
        highSeverity: 'high'
      },
      triglycerides: {
        patterns: [
          /triglyceride[s]?[:\s]+(\d+\.?\d*)\s*(?:mg\/dl|m[og]\/dl)?/i,
          /tg[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 0, max: 150, unit: 'mg/dL' },
        name: 'Triglycerides',
        critical: { max: 500 },
        highMsg: 'High triglycerides - Pancreatitis & heart disease risk',
        lowSeverity: 'mild',
        highSeverity: 'high'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Diabetes Markers Analysis
   */
  static analyzeDiabetesMarkers(text, result) {
    const tests = {
      glucose: {
        patterns: [
          /(?:fasting\s+)?glucose[:\s]+(\d+\.?\d*)\s*(?:mg\/dl)?/i,
          /blood\s+sugar[:\s]+(\d+\.?\d*)/i,
          /fbs[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 70, max: 100, unit: 'mg/dL' },
        name: 'Blood Glucose (Fasting)',
        critical: { min: 40, max: 250 },
        lowMsg: 'Hypoglycemia - Low blood sugar',
        highMsg: 'Hyperglycemia - Diabetes risk',
        lowSeverity: 'critical',
        highSeverity: 'high'
      },
      hba1c: {
        patterns: [
          /hba1c[:\s]+(\d+\.?\d*)\s*%?/i,
          /glycated\s+hemoglobin[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 4.0, max: 5.6, unit: '%' },
        name: 'HbA1c (3-month avg glucose)',
        critical: { max: 9.0 },
        highMsg: 'Prediabetes/Diabetes - Poor glucose control',
        lowSeverity: 'mild',
        highSeverity: 'high'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Liver Function Tests
   */
  static analyzeLiverFunction(text, result) {
    const tests = {
      alt: {
        patterns: [
          /(?:alt|sgpt)[:\s]+(\d+\.?\d*)\s*(?:u\/l|iu\/l)?/i,
          /alanine\s+aminotransferase[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 7, max: 56, unit: 'U/L' },
        name: 'ALT (SGPT)',
        critical: { max: 200 },
        highMsg: 'Elevated ALT - Liver inflammation',
        lowSeverity: 'mild',
        highSeverity: 'high'
      },
      ast: {
        patterns: [
          /(?:ast|sgot)[:\s]+(\d+\.?\d*)\s*(?:u\/l|iu\/l)?/i,
          /aspartate\s+aminotransferase[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 10, max: 40, unit: 'U/L' },
        name: 'AST (SGOT)',
        critical: { max: 200 },
        highMsg: 'Elevated AST - Liver/heart damage',
        lowSeverity: 'mild',
        highSeverity: 'high'
      },
      bilirubin: {
        patterns: [
          /(?:total\s+)?bilirubin[:\s]+(\d+\.?\d*)\s*(?:mg\/dl)?/i
        ],
        normal: { min: 0.1, max: 1.2, unit: 'mg/dL' },
        name: 'Total Bilirubin',
        critical: { max: 3.0 },
        highMsg: 'High bilirubin - Jaundice risk',
        lowSeverity: 'mild',
        highSeverity: 'high'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Kidney Function Tests
   */
  static analyzeKidneyFunction(text, result) {
    const tests = {
      creatinine: {
        patterns: [
          /creatinine[:\s]+(\d+\.?\d*)\s*(?:mg\/dl)?/i,
          /serum\s+creatinine[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 0.7, max: 1.3, unit: 'mg/dL' },
        name: 'Creatinine',
        critical: { max: 3.0 },
        highMsg: 'High creatinine - Kidney dysfunction',
        lowSeverity: 'mild',
        highSeverity: 'critical'
      },
      bun: {
        patterns: [
          /(?:bun|blood\s+urea\s+nitrogen)[:\s]+(\d+\.?\d*)\s*(?:mg\/dl)?/i,
          /urea[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 7, max: 20, unit: 'mg/dL' },
        name: 'Blood Urea Nitrogen (BUN)',
        critical: { max: 50 },
        highMsg: 'High BUN - Kidney function issue',
        lowSeverity: 'mild',
        highSeverity: 'high'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Thyroid Function Tests
   */
  static analyzeThyroidFunction(text, result) {
    const tests = {
      tsh: {
        patterns: [
          /tsh[:\s]+(\d+\.?\d*)\s*(?:miu\/l|uiu\/ml)?/i,
          /thyroid\s+stimulating\s+hormone[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 0.4, max: 4.0, unit: 'mIU/L' },
        name: 'TSH (Thyroid)',
        lowMsg: 'Low TSH - Hyperthyroidism',
        highMsg: 'High TSH - Hypothyroidism',
        lowSeverity: 'moderate',
        highSeverity: 'moderate'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Vitamin Tests
   */
  static analyzeVitamins(text, result) {
    const tests = {
      vitaminD: {
        patterns: [
          /vitamin\s+d[:\s]+(\d+\.?\d*)\s*(?:ng\/ml)?/i,
          /25[-\s]?oh[-\s]?d[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 30, max: 100, unit: 'ng/mL' },
        name: 'Vitamin D',
        lowMsg: 'Vitamin D deficiency - Bone health risk',
        highMsg: 'High Vitamin D',
        lowSeverity: 'moderate',
        highSeverity: 'mild'
      },
      vitaminB12: {
        patterns: [
          /(?:vitamin\s+)?b[-\s]?12[:\s]+(\d+\.?\d*)\s*(?:pg\/ml)?/i,
          /cobalamin[:\s]+(\d+\.?\d*)/i
        ],
        normal: { min: 200, max: 900, unit: 'pg/mL' },
        name: 'Vitamin B12',
        lowMsg: 'B12 deficiency - Anemia & nerve damage risk',
        highMsg: 'High B12',
        lowSeverity: 'moderate',
        highSeverity: 'mild'
      }
    };

    this.processTests(tests, text, result);
  }

  /**
   * Urine Tests
   */
  static analyzeUrineTests(text, result) {
    // Qualitative tests
    const qualitativeTests = {
      urineProtein: {
        patterns: [/protein[:\s]+(negative|trace|positive|\+)/i],
        normal: 'negative',
        name: 'Urine Protein',
        abnormalMsg: 'Proteinuria detected - Kidney issue',
        severity: 'high'
      },
      urineGlucose: {
        patterns: [/glucose[:\s]+(negative|trace|positive|\+)/i],
        normal: 'negative',
        name: 'Urine Glucose',
        abnormalMsg: 'Glycosuria detected - Diabetes risk',
        severity: 'high'
      },
      urineBlood: {
        patterns: [/blood[:\s]+(negative|trace|positive|\+)/i],
        normal: 'negative',
        name: 'Urine Blood',
        abnormalMsg: 'Hematuria detected - Bleeding in urinary tract',
        severity: 'critical'
      },
      urineKetones: {
        patterns: [/ketones?[:\s]+(negative|trace|positive|\+)/i],
        normal: 'negative',
        name: 'Urine Ketones',
        abnormalMsg: 'Ketonuria detected',
        severity: 'moderate'
      }
    };

    for (const [key, test] of Object.entries(qualitativeTests)) {
      for (const pattern of test.patterns) {
        const match = text.match(pattern);
        if (match) {
          result.totalTests++;
          const value = match[1].toLowerCase();
          const isNormal = value === test.normal || value === 'nil';
          
          if (isNormal) {
            result.normalCount++;
            result.normalResults.push(`${test.name}: ${value.toUpperCase()}`);
          } else {
            result.abnormalCount++;
            this.addConcern(result, test.severity, `${test.name}: ${value.toUpperCase()} - ${test.abnormalMsg}`);
          }
          break;
        }
      }
    }
  }

  /**
   * Process quantitative tests
   */
  static processTests(tests, text, result) {
    for (const [key, test] of Object.entries(tests)) {
      for (const pattern of test.patterns) {
        const match = text.match(pattern);
        if (match) {
          result.totalTests++;
          let value = parseFloat(match[1].replace(/,/g, ''));
          
          const { min, max, unit } = test.normal;
          const critical = test.critical || {};
          
          // Determine if normal
          if (value >= min && value <= max) {
            result.normalCount++;
            result.normalResults.push(`${test.name}: ${value} ${unit} (Normal)`);
          } else {
            result.abnormalCount++;
            
            if (value < min) {
              // Low value
              const severity = (critical.min && value < critical.min) ? 'critical' : test.lowSeverity || 'moderate';
              this.addConcern(result, severity, `${test.name}: ${value} ${unit} (LOW - Normal: ${min}-${max}) - ${test.lowMsg}`);
            } else {
              // High value
              const severity = (critical.max && value > critical.max) ? 'critical' : test.highSeverity || 'moderate';
              this.addConcern(result, severity, `${test.name}: ${value} ${unit} (HIGH - Normal: ${min}-${max}) - ${test.highMsg}`);
            }
          }
          break;
        }
      }
    }
  }

  /**
   * Add concern to appropriate severity list
   */
  static addConcern(result, severity, message) {
    switch (severity) {
      case 'critical':
        result.criticalConcerns.push(message);
        break;
      case 'high':
        result.highConcerns.push(message);
        break;
      case 'moderate':
        result.moderateConcerns.push(message);
        break;
      case 'mild':
        result.mildConcerns.push(message);
        break;
    }
  }

  /**
   * Generate recommendations based on findings
   */
  static generateRecommendations(result) {
    const hasAbnormal = result.abnormalCount > 0;
    const hasCritical = result.criticalConcerns.length > 0;
    const hasHigh = result.highConcerns.length > 0;

    // Immediate Actions
    if (hasCritical) {
      result.immediateActions.push('🚨 URGENT: Consult your doctor IMMEDIATELY - Critical values detected');
      result.immediateActions.push('📞 Contact emergency services if experiencing severe symptoms');
    }
    
    if (hasHigh) {
      result.immediateActions.push('⚕️ Schedule doctor appointment within 24-48 hours');
      result.immediateActions.push('📋 Bring this report to your healthcare provider');
    }

    if (!hasAbnormal) {
      result.immediateActions.push('✅ All results normal - Continue current health routine');
      result.immediateActions.push('📅 Schedule next check-up as per doctor recommendation');
    }

    // Specific recommendations based on abnormalities
    const allConcerns = [
      ...result.criticalConcerns,
      ...result.highConcerns,
      ...result.moderateConcerns
    ].join(' ').toLowerCase();

    // Cholesterol/Lipids
    if (/cholesterol|triglyceride|ldl|hdl/i.test(allConcerns)) {
      result.lifestyleRecommendations.push('🏃 Exercise: 30 minutes cardio daily, 5 days/week');
      result.lifestyleRecommendations.push('🚭 Avoid smoking and limit alcohol consumption');
      result.dietaryAdvice.push('🥗 Reduce saturated fats (red meat, butter, cheese)');
      result.dietaryAdvice.push('🐟 Increase omega-3 fatty acids (fish, nuts, seeds)');
      result.dietaryAdvice.push('🌾 Increase fiber intake (oats, beans, vegetables)');
      result.followUpAdvice.push('Repeat lipid profile in 3 months');
      result.followUpAdvice.push('Consider cardiology consultation');
    }

    // Diabetes/Glucose
    if (/glucose|diabetes|hba1c/i.test(allConcerns)) {
      result.lifestyleRecommendations.push('📊 Monitor blood sugar levels daily');
      result.lifestyleRecommendations.push('⚖️ Maintain healthy body weight (BMI 18.5-24.9)');
      result.dietaryAdvice.push('🍬 Limit refined sugars and carbohydrates');
      result.dietaryAdvice.push('🥦 Focus on low glycemic index foods');
      result.dietaryAdvice.push('🥤 Avoid sugary beverages');
      result.followUpAdvice.push('Consult endocrinologist for diabetes management');
      result.followUpAdvice.push('HbA1c test every 3 months');
    }

    // Liver
    if (/liver|alt|ast|bilirubin/i.test(allConcerns)) {
      result.lifestyleRecommendations.push('🚫 Avoid alcohol completely');
      result.lifestyleRecommendations.push('💊 Review all medications with doctor');
      result.dietaryAdvice.push('🥗 Eat liver-friendly foods (leafy greens, berries)');
      result.dietaryAdvice.push('🚰 Stay well-hydrated (8-10 glasses water daily)');
      result.followUpAdvice.push('Liver function tests in 4-6 weeks');
      result.followUpAdvice.push('Consider hepatology consultation');
    }

    // Kidney
    if (/kidney|creatinine|bun|protein.*urine/i.test(allConcerns)) {
      result.lifestyleRecommendations.push('💧 Stay well-hydrated (2-3 liters water daily)');
      result.lifestyleRecommendations.push('🧂 Limit salt intake');
      result.dietaryAdvice.push('🥩 Monitor protein intake - consult dietitian');
      result.dietaryAdvice.push('🍌 Limit potassium if advised by doctor');
      result.followUpAdvice.push('Kidney function tests in 2-4 weeks');
      result.followUpAdvice.push('Nephrology consultation recommended');
    }

    // Anemia
    if (/anemia|hemoglobin.*low|iron/i.test(allConcerns)) {
      result.dietaryAdvice.push('🥩 Increase iron-rich foods (red meat, spinach, lentils)');
      result.dietaryAdvice.push('🍊 Vitamin C aids iron absorption (citrus fruits)');
      result.dietaryAdvice.push('💊 Iron supplements as prescribed by doctor');
      result.followUpAdvice.push('Complete blood count in 6-8 weeks');
    }

    // Thyroid
    if (/thyroid|tsh/i.test(allConcerns)) {
      result.followUpAdvice.push('Thyroid function monitoring every 6-12 weeks');
      result.followUpAdvice.push('Endocrinology consultation for thyroid management');
    }

    // Vitamins
    if (/vitamin\s+d|b12/i.test(allConcerns)) {
      result.dietaryAdvice.push('☀️ Vitamin D: 15-20 min sun exposure daily');
      result.dietaryAdvice.push('🥛 Fortified foods (milk, cereals) for vitamin D');
      result.dietaryAdvice.push('🥚 B12 sources: eggs, dairy, meat, fortified cereals');
      result.followUpAdvice.push('Recheck vitamin levels in 3 months');
    }

    // General advice if no specific recommendations
    if (result.lifestyleRecommendations.length === 0 && hasAbnormal) {
      result.lifestyleRecommendations.push('🏃 Regular exercise - 150 min/week moderate activity');
      result.lifestyleRecommendations.push('😴 Adequate sleep - 7-9 hours nightly');
      result.lifestyleRecommendations.push('🧘 Stress management - meditation, yoga');
    }

    if (result.dietaryAdvice.length === 0 && hasAbnormal) {
      result.dietaryAdvice.push('🥗 Balanced diet with fruits and vegetables');
      result.dietaryAdvice.push('💧 Adequate hydration - 8-10 glasses water daily');
    }

    if (!hasAbnormal) {
      result.lifestyleRecommendations.push('✅ Continue current healthy lifestyle');
      result.dietaryAdvice.push('✅ Maintain balanced, nutritious diet');
    }
  }
}

export default LabAnalysisService;
