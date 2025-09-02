import { ExtractedMedicalData, TestResult } from '../types/MedicalRecord';

/**
 * OCR Service for extracting text and medical data from images
 * This is a mock implementation for development purposes
 */
export class OCRService {
  
  // Mock OCR service - in production, you'd use Google Cloud Vision API or similar
  static async extractTextFromImage(imageUri: string): Promise<string> {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted text based on common medical document patterns
    const mockTexts = [
      `Dr. Sarah Johnson, MD
Hospital: MediCenter Hospital
Date: ${new Date().toLocaleDateString()}
Patient: John Doe
Age: 35 | Gender: Male | Blood Type: O+

PRESCRIPTION:
1. Metformin 500mg - Take twice daily with meals
2. Lisinopril 10mg - Take once daily in morning
3. Atorvastatin 20mg - Take once daily at bedtime

Next Appointment: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Follow-up required in 4 weeks`,

      `LABORATORY REPORT
MediLab Testing Center
Date: ${new Date().toLocaleDateString()}
Patient: John Doe

COMPLETE BLOOD COUNT:
- Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
- White Blood Cells: 7,200 cells/μL (Normal: 4,500-11,000)
- Platelets: 280,000 cells/μL (Normal: 150,000-450,000)

LIPID PROFILE:
- Total Cholesterol: 195 mg/dL (Normal: <200)
- HDL Cholesterol: 45 mg/dL (Normal: >40)
- LDL Cholesterol: 120 mg/dL (Normal: <100) *HIGH*
- Triglycerides: 150 mg/dL (Normal: <150)

BLOOD GLUCOSE:
- Fasting Glucose: 105 mg/dL (Normal: 70-100) *SLIGHTLY HIGH*`,

      `DISCHARGE SUMMARY
City General Hospital
Discharge Date: ${new Date().toLocaleDateString()}
Patient: John Doe

DIAGNOSIS:
- Hypertension, controlled
- Type 2 Diabetes Mellitus
- Hyperlipidemia

MEDICATIONS AT DISCHARGE:
1. Metformin 500mg BID
2. Lisinopril 10mg daily
3. Atorvastatin 20mg daily

FOLLOW-UP:
- Primary care physician in 2 weeks
- Cardiology consultation in 1 month
- Lab work in 3 months`
    ];

    // Return a random mock text
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }

  static async extractMedicalData(extractedText: string): Promise<ExtractedMedicalData> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const data: ExtractedMedicalData = {};

    // Extract doctor name
    const doctorMatch = extractedText.match(/Dr\.\s+([A-Za-z\s]+),?\s*(MD|DO)?/i);
    if (doctorMatch) {
      data.doctorName = doctorMatch[1].trim();
    }

    // Extract hospital name
    const hospitalMatch = extractedText.match(/Hospital:\s*([A-Za-z\s]+)/i) || 
                         extractedText.match(/([A-Za-z\s]+Hospital)/i) ||
                         extractedText.match(/([A-Za-z\s]+Medical Center)/i);
    if (hospitalMatch) {
      data.hospitalName = hospitalMatch[1].trim();
    }

    // Extract medications
    const medicationRegex = /(?:PRESCRIPTION|MEDICATIONS?)[\s\S]*?(\d+\.\s*[A-Za-z\s]+\d+mg[^\n]*)/gi;
    const medications: string[] = [];
    let match;
    while ((match = medicationRegex.exec(extractedText)) !== null) {
      medications.push(match[1].trim());
    }
    if (medications.length > 0) {
      data.medications = medications;
    }

    // Extract test results
    const testResults: TestResult[] = [];
    
    // Look for lab values patterns
    const labPatterns = [
      /([A-Za-z\s]+):\s*([\d.]+)\s*([A-Za-z\/μ]+)\s*\(Normal:\s*([^)]+)\)(\s*\*?(HIGH|LOW|ABNORMAL)?\*?)?/gi
    ];

    labPatterns.forEach(pattern => {
      let testMatch;
      while ((testMatch = pattern.exec(extractedText)) !== null) {
        testResults.push({
          testName: testMatch[1].trim(),
          value: testMatch[2],
          unit: testMatch[3],
          referenceRange: testMatch[4],
          isAbnormal: testMatch[6] !== undefined
        });
      }
    });

    if (testResults.length > 0) {
      data.testResults = testResults;
    }

    // Extract vital signs
    const vitals: any = {};
    
    const bpMatch = extractedText.match(/Blood Pressure:\s*(\d+\/\d+)/i);
    if (bpMatch) vitals.bloodPressure = bpMatch[1];
    
    const heartRateMatch = extractedText.match(/Heart Rate:\s*(\d+)/i);
    if (heartRateMatch) vitals.heartRate = parseInt(heartRateMatch[1]);
    
    const tempMatch = extractedText.match(/Temperature:\s*([\d.]+)/i);
    if (tempMatch) vitals.temperature = parseFloat(tempMatch[1]);
    
    const weightMatch = extractedText.match(/Weight:\s*([\d.]+)/i);
    if (weightMatch) vitals.weight = parseFloat(weightMatch[1]);

    if (Object.keys(vitals).length > 0) {
      data.vitals = vitals;
    }

    // Extract next appointment
    const appointmentMatch = extractedText.match(/(?:Next Appointment|Follow-up):\s*([^\n]+)/i);
    if (appointmentMatch) {
      const dateStr = appointmentMatch[1].trim();
      const appointmentDate = new Date(dateStr);
      if (!isNaN(appointmentDate.getTime())) {
        data.nextAppointment = appointmentDate;
      }
    }

    // Determine test type
    if (extractedText.toLowerCase().includes('blood') || extractedText.toLowerCase().includes('lab')) {
      data.testType = 'Blood Test / Lab Work';
    } else if (extractedText.toLowerCase().includes('prescription')) {
      data.testType = 'Prescription';
    } else if (extractedText.toLowerCase().includes('discharge')) {
      data.testType = 'Discharge Summary';
    }

    return data;
  }

  static generateTags(extractedText: string, extractedData: ExtractedMedicalData): string[] {
    const tags: string[] = [];

    // Add tags based on content
    if (extractedText.toLowerCase().includes('blood')) tags.push('blood-test');
    if (extractedText.toLowerCase().includes('prescription')) tags.push('prescription');
    if (extractedText.toLowerCase().includes('diabetes')) tags.push('diabetes');
    if (extractedText.toLowerCase().includes('hypertension')) tags.push('hypertension');
    if (extractedText.toLowerCase().includes('cholesterol')) tags.push('cholesterol');
    if (extractedText.toLowerCase().includes('heart')) tags.push('cardiology');
    if (extractedText.toLowerCase().includes('glucose')) tags.push('glucose');
    
    // Add doctor name as tag
    if (extractedData.doctorName) {
      tags.push(`dr-${extractedData.doctorName.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Add hospital as tag
    if (extractedData.hospitalName) {
      tags.push(extractedData.hospitalName.toLowerCase().replace(/\s+/g, '-'));
    }

    // Add test type as tag
    if (extractedData.testType) {
      tags.push(extractedData.testType.toLowerCase().replace(/\s+/g, '-'));
    }

    return [...new Set(tags)]; // Remove duplicates
  }
}

export default OCRService;
