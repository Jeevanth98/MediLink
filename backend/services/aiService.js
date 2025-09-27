import vision from '@google-cloud/vision';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Cloud Vision client
let visionClient;
try {
  visionClient = new vision.ImageAnnotatorClient({
    keyFilename: null, // We'll use API key instead of service account
    apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
  });
} catch (error) {
  console.warn('⚠️ Google Cloud Vision initialization warning:', error.message);
  visionClient = null;
}

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export class AIService {
  
  /**
   * Extract text from image using Google Cloud Vision OCR
   */
  static async extractTextFromImage(filePath) {
    try {
      console.log('🔍 Starting OCR for file:', filePath);
      
      if (!visionClient) {
        throw new Error('Google Cloud Vision client not initialized');
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Read the file
      const imageBuffer = fs.readFileSync(filePath);
      
      // Perform OCR
      const [result] = await visionClient.textDetection({
        image: {
          content: imageBuffer
        }
      });

      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        return {
          success: false,
          text: '',
          confidence: 0,
          error: 'No text detected in image'
        };
      }

      const extractedText = detections[0]?.description || '';
      
      // Calculate average confidence (Vision API doesn't provide direct confidence for text detection)
      const confidence = 0.85; // Default confidence score
      
      console.log('✅ OCR completed successfully');
      console.log('📝 Extracted text length:', extractedText.length);
      
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
   * Analyze individual document with Gemini AI
   */
  static async analyzeDocument(documentType, extractedText, originalFilename) {
    try {
      console.log('🤖 Starting AI analysis for:', originalFilename);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text available for analysis');
      }

      let prompt = '';
      
      switch (documentType) {
        case 'Lab Report':
          prompt = `You are a medical AI assistant. Analyze this lab report and provide insights in simple English that a patient can understand. 

Lab Report Text:
${extractedText}

Please provide your analysis in the following format:
📊 Lab Report Analysis

🔍 Key Findings:
• [List the main test results with their values and normal ranges]
• [Indicate if values are high, low, or normal with percentages where applicable]

⚠️ Areas of Concern:
• [Highlight any abnormal results and their potential implications]

💡 Recommendations:
• [Suggest next steps, lifestyle changes, or when to consult a doctor]

Keep the language simple and avoid medical jargon. Focus on what the results mean for the patient's health.`;
          break;
          
        case 'Prescription':
          prompt = `You are a medical AI assistant. Analyze this prescription and provide clear information about the medications.

Prescription Text:
${extractedText}

Please provide your analysis in the following format:
💊 Prescription Analysis

🔍 Prescribed Medications:
• [List each medication with dosage and frequency]

📋 Treatment Purpose:
• [Explain what condition is being treated]

⚠️ Important Notes:
• [Any special instructions, side effects to watch for]

💡 Reminders:
• [Timing of doses, food interactions, duration of treatment]

Keep explanations simple and patient-friendly.`;
          break;
          
        case 'Medical Imaging (X-ray, MRI, etc.)':
          prompt = `You are a medical AI assistant. This appears to be a medical imaging report. Analyze the text and provide patient-friendly insights.

Medical Imaging Report Text:
${extractedText}

Please provide your analysis in the following format:
📷 Medical Imaging Analysis

🔍 Findings:
• [Summarize what the imaging showed]

📋 Clinical Significance:
• [Explain what these findings mean in simple terms]

💡 Next Steps:
• [Recommendations for follow-up or treatment]

Use simple language that patients can understand.`;
          break;
          
        case 'Doctor\'s Notes':
          prompt = `You are a medical AI assistant. Analyze these doctor's notes and provide a clear summary for the patient.

Doctor's Notes:
${extractedText}

Please provide your analysis in the following format:
👨‍⚕️ Doctor's Notes Summary

🔍 Visit Summary:
• [What was discussed during the visit]

📋 Diagnosis/Assessment:
• [Doctor's findings and assessment]

💊 Treatment Plan:
• [Prescribed treatments or medications]

💡 Follow-up Instructions:
• [Next steps and appointments]

Make this accessible to patients in simple terms.`;
          break;
          
        default:
          prompt = `You are a medical AI assistant. Analyze this medical document and provide helpful insights for the patient.

Document Text:
${extractedText}

Please provide your analysis in the following format:
📄 Document Analysis

🔍 Key Information:
• [Main points from the document]

📋 Medical Context:
• [Relevant health information]

💡 Important Notes:
• [What the patient should know]

Use simple, patient-friendly language.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiAnalysis = response.text();

      // Extract key findings and recommendations (simplified parsing)
      const keyFindingsMatch = aiAnalysis.match(/🔍 Key (?:Findings|Information):(.*?)(?=📋|💡|$)/s);
      const recommendationsMatch = aiAnalysis.match(/💡 (?:Recommendations|Important Notes|Next Steps|Reminders):(.*?)$/s);
      
      const keyFindings = keyFindingsMatch ? keyFindingsMatch[1].trim() : '';
      const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : '';

      console.log('✅ AI analysis completed successfully');
      
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