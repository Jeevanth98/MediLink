import { GoogleGenerativeAI } from '@google/generative-ai';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI client for analysis only
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export class AIService {
  
  /**
   * Extract text from image using Tesseract.js (FREE, Local OCR)
   */
  static async extractTextFromImage(filePath) {
    try {
      console.log('🔍 Starting OCR with Tesseract.js for file:', filePath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Use Tesseract.js to extract text
      const result = await Tesseract.recognize(
        filePath,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const extractedText = result.data.text;
      const confidence = result.data.confidence / 100; // Convert to 0-1 scale
      
      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: false,
          text: '',
          confidence: 0,
          error: 'No text detected in image'
        };
      }
      
      console.log('✅ OCR completed successfully with Tesseract.js');
      console.log('📝 Extracted text length:', extractedText.length);
      console.log('🎯 Confidence:', Math.round(confidence * 100) + '%');
      
      return {
        success: true,
        text: extractedText,
        confidence: confidence,
        error: null
      };
      
    } catch (error) {
      console.error('❌ OCR Error:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Analyze individual document with Rule-Based AI (No API Required)
   */
  static async analyzeDocument(documentType, extractedText, originalFilename) {
    try {
      console.log('🤖 Starting rule-based AI analysis for:', originalFilename);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text available for analysis');
      }

      // Auto-detect if document is a lab report based on keywords
      const labKeywords = /hemoglobin|glucose|cholesterol|platelet|wbc|rbc|creatinine|vitamin|urine|blood test|lab test|test results?|reference range/i;
      const prescriptionKeywords = /rx|prescription|medication|dosage|mg|tablet|capsule|syrup/i;
      
      let actualType = documentType;
      
      // If document type is "Others", try to auto-detect
      if (documentType === 'Others' || !documentType) {
        if (labKeywords.test(extractedText)) {
          actualType = 'Lab Report';
          console.log('📊 Auto-detected as Lab Report based on content');
        } else if (prescriptionKeywords.test(extractedText)) {
          actualType = 'Prescription';
          console.log('💊 Auto-detected as Prescription based on content');
        }
      }

      let aiAnalysis = '';
      let keyFindings = '';
      let recommendations = '';
      
      switch (actualType) {
        case 'Lab Report':
        case 'Lab Test': // Also accept "Lab Test" as valid type
          const labAnalysis = this.analyzeLabReport(extractedText);
          aiAnalysis = labAnalysis.fullAnalysis;
          keyFindings = labAnalysis.keyFindings;
          recommendations = labAnalysis.recommendations;
          break;
          
        case 'Prescription':
          const prescriptionAnalysis = this.analyzePrescription(extractedText);
          aiAnalysis = prescriptionAnalysis.fullAnalysis;
          keyFindings = prescriptionAnalysis.keyFindings;
          recommendations = prescriptionAnalysis.recommendations;
          break;
          
        case 'Medical Imaging (X-ray, MRI, etc.)':
          const imagingAnalysis = this.analyzeMedicalImaging(extractedText);
          aiAnalysis = imagingAnalysis.fullAnalysis;
          keyFindings = imagingAnalysis.keyFindings;
          recommendations = imagingAnalysis.recommendations;
          break;
          
        case 'Doctor\'s Notes':
          const notesAnalysis = this.analyzeDoctorNotes(extractedText);
          aiAnalysis = notesAnalysis.fullAnalysis;
          keyFindings = notesAnalysis.keyFindings;
          recommendations = notesAnalysis.recommendations;
          break;
          
        default:
          const generalAnalysis = this.analyzeGeneralDocument(extractedText);
          aiAnalysis = generalAnalysis.fullAnalysis;
          keyFindings = generalAnalysis.keyFindings;
          recommendations = generalAnalysis.recommendations;
      }

      console.log('✅ Rule-based AI analysis completed successfully');
      
      return {
        success: true,
        fullAnalysis: aiAnalysis,
        keyFindings: keyFindings,
        recommendations: recommendations,
        error: null
      };
      
    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      return {
        success: false,
        fullAnalysis: '',
        keyFindings: '',
        recommendations: '',
        error: error.message
      };
    }
  }

  /**
   * Analyze Lab Report using pattern matching and medical rules
   */
  static analyzeLabReport(text) {
    const findings = [];
    const concerns = [];
    const recs = [];
    
    // Common lab test patterns and normal ranges
    const labTests = {
      // Blood Tests
      'hemoglobin': { 
        pattern: /hemoglobin[:\s]*([\d]+\.?[\d]*)\s*(g\/dl|g\/L)?/i,
        normalRange: { min: 13.5, max: 17.5, unit: 'g/dL' },
        lowCondition: 'Anemia',
        highCondition: 'Polycythemia',
        fixValue: (val) => val > 100 ? val / 10 : val
      },
      'rbc': {
        pattern: /rbc count[:\s]*([\d.]+)/i,
        normalRange: { min: 4.5, max: 5.5, unit: 'million/mm³' },
        lowCondition: 'Low Red Blood Cell Count',
        highCondition: 'High Red Blood Cell Count'
      },
      'wbc': {
        pattern: /wbc count[:\s]*([\d,]+)/i,
        normalRange: { min: 4000, max: 11000, unit: '/mm³' },
        lowCondition: 'Leukopenia (Low White Blood Cells)',
        highCondition: 'Leukocytosis (High White Blood Cells)'
      },
      'platelet': {
        pattern: /platelet[s]?\s+count[:\s]*([\d,]+)/i,
        normalRange: { min: 150000, max: 410000, unit: '/mm³' },
        lowCondition: 'Thrombocytopenia (Low Platelets)',
        highCondition: 'Thrombocytosis (High Platelets)'
      },
      'glucose': {
        pattern: /glucose[:\s]*([\d]+\.?[\d]*)\s*(mg\/dl)?/i,
        normalRange: { min: 70, max: 100, unit: 'mg/dL' },
        lowCondition: 'Hypoglycemia',
        highCondition: 'Hyperglycemia/Diabetes Risk'
      },
      'hba1c': {
        pattern: /hba1c[:\s]*([\d.]+)\s*%?/i,
        normalRange: { min: 4.0, max: 5.6, unit: '%' },
        lowCondition: 'Low HbA1c',
        highCondition: 'Prediabetes/Diabetes Risk'
      },
      'cholesterol_total': {
        pattern: /(?:total\s+)?cholesterol[:\s]*([\d]+)\s*(mg\/dl)?/i,
        normalRange: { min: 125, max: 200, unit: 'mg/dL' },
        lowCondition: 'Low Cholesterol',
        highCondition: 'High Cholesterol'
      },
      'hdl': {
        pattern: /hdl[:\s]*([\d]+)\s*(mg\/dl)?/i,
        normalRange: { min: 40, max: 60, unit: 'mg/dL' },
        lowCondition: 'Low HDL (Good Cholesterol)',
        highCondition: 'High HDL (Good)'
      },
      'ldl': {
        pattern: /ldl[:\s]*([\d]+)\s*(mg\/dl)?/i,
        normalRange: { min: 0, max: 100, unit: 'mg/dL' },
        lowCondition: 'Low LDL',
        highCondition: 'High LDL (Bad Cholesterol)'
      },
      'triglycerides': {
        pattern: /triglycerides[:\s]*([\d]+)\s*(mg\/dl)?/i,
        normalRange: { min: 0, max: 150, unit: 'mg/dL' },
        lowCondition: 'Low Triglycerides',
        highCondition: 'High Triglycerides'
      },
      'creatinine': {
        pattern: /creatinine[:\s]*([\d.]+)\s*(mg\/dl)?/i,
        normalRange: { min: 0.7, max: 1.3, unit: 'mg/dL' },
        lowCondition: 'Low Creatinine',
        highCondition: 'High Creatinine (Kidney Function)'
      },
      'bun': {
        pattern: /(?:bun|urea)[:\s]*([\d]+)\s*(mg\/dl)?/i,
        normalRange: { min: 7, max: 20, unit: 'mg/dL' },
        lowCondition: 'Low BUN',
        highCondition: 'High BUN (Kidney Function)'
      },
      'tsh': {
        pattern: /tsh[:\s]*([\d.]+)\s*(miu\/l)?/i,
        normalRange: { min: 0.4, max: 4.0, unit: 'mIU/L' },
        lowCondition: 'Hyperthyroidism',
        highCondition: 'Hypothyroidism'
      },
      'vitamin_d': {
        pattern: /vitamin\s+d[:\s]*([\d.]+)\s*(ng\/ml)?/i,
        normalRange: { min: 30, max: 100, unit: 'ng/mL' },
        lowCondition: 'Vitamin D Deficiency',
        highCondition: 'High Vitamin D'
      },
      'vitamin_b12': {
        pattern: /(?:vitamin\s+)?b12[:\s]*([\d]+)\s*(pg\/ml)?/i,
        normalRange: { min: 200, max: 900, unit: 'pg/mL' },
        lowCondition: 'Vitamin B12 Deficiency',
        highCondition: 'High Vitamin B12'
      },
      
      // Urine Tests
      'urine_protein': {
        pattern: /protein[:\s]*([a-z]+|[\d.]+\s*mg\/dl)/i,
        normalValue: 'negative',
        abnormalCondition: 'Proteinuria (Protein in Urine)',
        checkAbnormal: (val) => !/negative|nil|trace/i.test(val)
      },
      'urine_glucose': {
        pattern: /glucose[:\s]*([a-z]+|[\d.]+\s*mg\/dl)/i,
        normalValue: 'negative',
        abnormalCondition: 'Glycosuria (Glucose in Urine)',
        checkAbnormal: (val) => !/negative|nil/i.test(val)
      },
      'urine_ketones': {
        pattern: /ketones?[:\s]*([a-z]+)/i,
        normalValue: 'negative',
        abnormalCondition: 'Ketonuria (Ketones in Urine)',
        checkAbnormal: (val) => !/negative|nil/i.test(val)
      },
      'urine_blood': {
        pattern: /blood[:\s]*([a-z]+)/i,
        normalValue: 'negative',
        abnormalCondition: 'Hematuria (Blood in Urine)',
        checkAbnormal: (val) => !/negative|nil/i.test(val)
      },
      'urine_ph': {
        pattern: /ph[:\s]*([\d.]+)/i,
        normalRange: { min: 4.5, max: 8.0, unit: '' },
        lowCondition: 'Acidic Urine',
        highCondition: 'Alkaline Urine'
      },
      'urine_specific_gravity': {
        pattern: /specific\s+gravity[:\s]*([\d.]+)/i,
        normalRange: { min: 1.005, max: 1.030, unit: '' },
        lowCondition: 'Dilute Urine (Possible Overhydration)',
        highCondition: 'Concentrated Urine (Possible Dehydration)'
      },
      'urine_wbc': {
        pattern: /(?:wbc|pus\s+cells)[:\s]*([\d]+)(?:\/hpf)?/i,
        normalRange: { min: 0, max: 5, unit: '/HPF' },
        lowCondition: 'Low WBC',
        highCondition: 'Urinary Tract Infection (UTI)'
      },
      'urine_rbc': {
        pattern: /(?:rbc|red\s+blood\s+cells)[:\s]*([\d]+)(?:\/hpf)?/i,
        normalRange: { min: 0, max: 3, unit: '/HPF' },
        lowCondition: 'Low RBC',
        highCondition: 'Hematuria (Blood in Urine)'
      }
    };

    // Analyze each test
    for (const [testName, testInfo] of Object.entries(labTests)) {
      const match = text.match(testInfo.pattern);
      if (match) {
        let value = match[1];
        
        // Handle qualitative tests (urine tests like protein, glucose, etc.)
        if (testInfo.normalValue) {
          const isAbnormal = testInfo.checkAbnormal(value);
          if (isAbnormal) {
            findings.push(`• ${testName.toUpperCase().replace(/_/g, ' ')}: ${value} (ABNORMAL - should be ${testInfo.normalValue})`);
            concerns.push(`• ${testInfo.abnormalCondition} detected`);
          } else {
            findings.push(`• ${testName.toUpperCase().replace(/_/g, ' ')}: ${value} (NORMAL)`);
          }
          continue;
        }
        
        // Handle quantitative tests (numeric values)
        value = parseFloat(value.replace(/,/g, ''));
        
        // Apply value fix if function exists (e.g., fix OCR errors)
        if (testInfo.fixValue) {
          value = testInfo.fixValue(value);
        }
        
        const { min, max, unit } = testInfo.normalRange;
        
        if (value < min) {
          findings.push(`• ${testName.toUpperCase()}: ${value} ${unit} (LOW - below normal range ${min}-${max} ${unit})`);
          concerns.push(`• ${testInfo.lowCondition} detected`);
        } else if (value > max) {
          findings.push(`• ${testName.toUpperCase()}: ${value} ${unit} (HIGH - above normal range ${min}-${max} ${unit})`);
          concerns.push(`• ${testInfo.highCondition} detected`);
        } else {
          findings.push(`• ${testName.toUpperCase()}: ${value} ${unit} (NORMAL - within range ${min}-${max} ${unit})`);
        }
      }
    }

    // Check for specific keywords in clinical notes
    if (/anemia/i.test(text)) {
      recs.push('• Consider iron supplementation and iron-rich diet (spinach, red meat, beans)');
      recs.push('• Schedule follow-up blood test in 4-8 weeks');
    }
    
    if (/low|below/i.test(text) && /hemoglobin/i.test(text)) {
      recs.push('• Increase intake of vitamin B12 and folate');
      recs.push('• Consult with a hematologist if levels continue to drop');
    }

    if (/high|elevated/i.test(text) && /glucose|sugar/i.test(text)) {
      recs.push('• Monitor blood sugar levels regularly');
      recs.push('• Consider consultation with endocrinologist');
      recs.push('• Maintain healthy diet and regular exercise');
    }

    // Generic recommendations
    if (concerns.length === 0) {
      recs.push('• All test results are within normal ranges');
      recs.push('• Continue maintaining healthy lifestyle');
      recs.push('• Schedule routine check-ups as recommended by your doctor');
    } else {
      recs.push('• Discuss these results with your healthcare provider');
      recs.push('• Follow prescribed treatment plan');
    }

    const fullAnalysis = `📊 Lab Report Analysis

🔍 Key Findings:
${findings.join('\n')}

${concerns.length > 0 ? `⚠️ Areas of Concern:\n${concerns.join('\n')}\n\n` : ''}💡 Recommendations:
${recs.join('\n')}

📌 Important: This is an automated analysis. Always consult with your healthcare provider for proper medical advice.`;

    return {
      fullAnalysis,
      keyFindings: findings.join('\n'),
      recommendations: recs.join('\n')
    };
  }

  /**
   * Analyze Prescription
   */
  static analyzePrescription(text) {
    const medications = [];
    const instructions = [];
    const warnings = [];

    // Common medication patterns
    const medPatterns = [
      /tab[.\s]+([a-z]+)\s*([\d]+\s*mg)/i,
      /cap[.\s]+([a-z]+)\s*([\d]+\s*mg)/i,
      /syrup\s+([a-z]+)\s*([\d]+\s*ml)/i
    ];

    for (const pattern of medPatterns) {
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        medications.push(`• ${match[1]} - ${match[2]}`);
      }
    }

    // Extract dosage instructions
    if (/twice\s+(?:a\s+)?day|bid/i.test(text)) {
      instructions.push('• Take medication twice daily (morning and evening)');
    }
    if (/once\s+(?:a\s+)?day|od/i.test(text)) {
      instructions.push('• Take medication once daily');
    }
    if (/before\s+(?:meals|food)/i.test(text)) {
      instructions.push('• Take before meals');
    }
    if (/after\s+(?:meals|food)/i.test(text)) {
      instructions.push('• Take after meals');
    }

    // Safety warnings
    warnings.push('• Take medications exactly as prescribed');
    warnings.push('• Do not stop medications without consulting your doctor');
    warnings.push('• Inform your doctor of any side effects');
    warnings.push('• Keep medications out of reach of children');

    const fullAnalysis = `💊 Prescription Analysis

🔍 Prescribed Medications:
${medications.length > 0 ? medications.join('\n') : '• See prescription details above'}

📋 Dosage Instructions:
${instructions.length > 0 ? instructions.join('\n') : '• Follow doctor\'s instructions carefully'}

⚠️ Important Safety Information:
${warnings.join('\n')}

📌 Note: Complete the full course of medication even if you feel better.`;

    return {
      fullAnalysis,
      keyFindings: medications.join('\n'),
      recommendations: warnings.join('\n')
    };
  }

  /**
   * Analyze Medical Imaging Reports
   */
  static analyzeMedicalImaging(text) {
    const findings = [];
    const recommendations = [];

    // Check for common imaging findings
    if (/normal/i.test(text)) {
      findings.push('• Study shows normal findings');
    }
    if (/fracture/i.test(text)) {
      findings.push('• Fracture detected - requires orthopedic consultation');
      recommendations.push('• Consult orthopedic specialist immediately');
      recommendations.push('• Follow prescribed immobilization protocol');
    }
    if (/mass|lesion|nodule/i.test(text)) {
      findings.push('• Abnormal mass/lesion detected');
      recommendations.push('• Further investigation required');
      recommendations.push('• Follow-up imaging may be needed');
    }

    if (findings.length === 0) {
      findings.push('• Review detailed imaging report with your radiologist');
    }

    if (recommendations.length === 0) {
      recommendations.push('• Discuss results with your referring physician');
      recommendations.push('• Keep imaging reports for future reference');
    }

    const fullAnalysis = `📷 Medical Imaging Analysis

🔍 Findings:
${findings.join('\n')}

💡 Recommendations:
${recommendations.join('\n')}

📌 Important: Imaging reports should always be reviewed by a qualified radiologist.`;

    return {
      fullAnalysis,
      keyFindings: findings.join('\n'),
      recommendations: recommendations.join('\n')
    };
  }

  /**
   * Analyze Doctor's Notes
   */
  static analyzeDoctorNotes(text) {
    const summary = [];
    const recommendations = [];

    // Extract key information
    if (/diagnosis/i.test(text)) {
      summary.push('• Diagnosis information recorded');
    }
    if (/treatment/i.test(text)) {
      summary.push('• Treatment plan documented');
    }
    if (/follow[- ]?up/i.test(text)) {
      summary.push('• Follow-up visit required');
      recommendations.push('• Schedule follow-up appointment as advised');
    }

    recommendations.push('• Follow prescribed treatment plan');
    recommendations.push('• Contact doctor if symptoms worsen');
    recommendations.push('• Keep record of all medical documents');

    const fullAnalysis = `👨‍⚕️ Doctor's Notes Summary

📋 Visit Summary:
${summary.length > 0 ? summary.join('\n') : '• Medical consultation documented'}

💡 Follow-up Instructions:
${recommendations.join('\n')}

📌 Note: Maintain regular communication with your healthcare provider.`;

    return {
      fullAnalysis,
      keyFindings: summary.join('\n'),
      recommendations: recommendations.join('\n')
    };
  }

  /**
   * Analyze General Medical Document
   */
  static analyzeGeneralDocument(text) {
    const keyInfo = [];
    const recommendations = [];

    // Extract dates
    const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g;
    const dates = text.match(datePattern);
    if (dates) {
      keyInfo.push(`• Document contains ${dates.length} date reference(s)`);
    }

    // Check for patient information
    if (/patient\s+(?:name|id)/i.test(text)) {
      keyInfo.push('• Patient information present');
    }

    recommendations.push('• Store this document securely');
    recommendations.push('• Share with healthcare providers as needed');
    recommendations.push('• Keep organized medical records');

    const fullAnalysis = `📄 Document Analysis

🔍 Key Information:
${keyInfo.length > 0 ? keyInfo.join('\n') : '• Medical document processed'}

💡 Important Notes:
${recommendations.join('\n')}

📌 Reminder: Keep all medical documents organized and accessible.`;

    return {
      fullAnalysis,
      keyFindings: keyInfo.join('\n'),
      recommendations: recommendations.join('\n')
    };
  }

  /**
   * Generate comprehensive health summary from multiple documents
   */
  static async generateHealthSummary(familyMemberData, documentsData, dateRangeStart, dateRangeEnd) {
    try {
      console.log('🏥 Generating comprehensive health summary');
      
      if (!documentsData || documentsData.length === 0) {
        throw new Error('No documents available for health summary');
      }

      // Prepare the context
      const familyMemberInfo = `Patient: ${familyMemberData.name}, Age: ${familyMemberData.age}, Gender: ${familyMemberData.gender}, Blood Group: ${familyMemberData.blood_group}`;
      
      const dateRangeInfo = dateRangeStart && dateRangeEnd ? 
        `Analysis Period: ${dateRangeStart} to ${dateRangeEnd}` : 
        'Analysis Period: All available records';

      // Compile all document texts
      let allDocumentTexts = '';
      documentsData.forEach((doc, index) => {
        if (doc.extracted_text) {
          allDocumentTexts += `\n\nDocument ${index + 1} (${doc.document_type} - ${doc.original_filename}):\n${doc.extracted_text}`;
        }
      });

      const prompt = `You are a medical AI assistant creating a comprehensive health summary. Analyze all the provided medical documents and create a one-page health summary.

${familyMemberInfo}
${dateRangeInfo}

Medical Documents:${allDocumentTexts}

Please provide a comprehensive health summary in the following format:

🏥 COMPREHENSIVE HEALTH SUMMARY
Patient: ${familyMemberData.name}

📊 HEALTH OVERVIEW
• [Overall health status based on available records]
• [Key medical conditions identified]
• [Current medications and treatments]

🔍 KEY FINDINGS FROM RECORDS
• [Important results from lab reports]
• [Significant findings from imaging studies]
• [Notable observations from doctor visits]

📈 HEALTH TRENDS & PATTERNS
• [Any patterns or trends observed over time]
• [Improvements or concerns noted]

⚠️ AREAS REQUIRING ATTENTION
• [Health issues that need monitoring]
• [Potential risk factors]

💡 HEALTH RECOMMENDATIONS
• [Lifestyle recommendations]
• [Follow-up care suggestions]
• [Preventive measures]

🎯 NEXT STEPS
• [Recommended medical consultations]
• [Tests or screenings due]
• [Monitoring requirements]

Keep the language patient-friendly and provide actionable insights. Focus on the most important health information.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const healthSummary = response.text();

      console.log('✅ Health summary generated successfully');
      
      return {
        success: true,
        healthSummary: healthSummary,
        error: null
      };
      
    } catch (error) {
      console.error('❌ Health Summary Error:', error);
      return {
        success: false,
        healthSummary: '',
        error: error.message
      };
    }
  }

  /**
   * Check if file is suitable for OCR processing
   */
  static isFileProcessable(filePath, fileType) {
    const supportedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    const supportedDocTypes = [
      'application/pdf'
    ];

    return supportedImageTypes.includes(fileType) || supportedDocTypes.includes(fileType);
  }

  /**
   * Get file size in MB
   */
  static getFileSizeInMB(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size / (1024 * 1024); // Convert bytes to MB
    } catch (error) {
      return 0;
    }
  }
}