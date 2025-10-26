import { createCanvas } from 'canvas';
import fs from 'fs';

// Lab report templates
const labReports = [
  {
    filename: 'lipid-profile-report.png',
    title: 'LIPID PROFILE TEST REPORT',
    patientName: 'Priya Kumar',
    patientId: 'PT-2025-2001',
    age: '42',
    gender: 'Female',
    collectedDate: 'October 20, 2025',
    reportedDate: 'October 21, 2025',
    tests: [
      { parameter: 'Total Cholesterol', result: '245', unit: 'mg/dL' },
      { parameter: 'HDL Cholesterol', result: '35', unit: 'mg/dL' },
      { parameter: 'LDL Cholesterol', result: '165', unit: 'mg/dL' },
      { parameter: 'Triglycerides', result: '220', unit: 'mg/dL' },
      { parameter: 'VLDL', result: '44', unit: 'mg/dL' }
    ]
  },
  {
    filename: 'thyroid-function-test.png',
    title: 'THYROID FUNCTION TEST REPORT',
    patientName: 'Rajesh Sharma',
    patientId: 'PT-2025-2002',
    age: '55',
    gender: 'Male',
    collectedDate: 'October 22, 2025',
    reportedDate: 'October 23, 2025',
    tests: [
      { parameter: 'TSH', result: '6.8', unit: 'mIU/L' },
      { parameter: 'T3 Total', result: '0.9', unit: 'ng/mL' },
      { parameter: 'T4 Total', result: '5.2', unit: 'µg/dL' },
      { parameter: 'Free T3', result: '2.1', unit: 'pg/mL' },
      { parameter: 'Free T4', result: '0.7', unit: 'ng/dL' }
    ]
  },
  {
    filename: 'urine-routine-test.png',
    title: 'URINE ROUTINE & MICROSCOPY REPORT',
    patientName: 'Ananya Desai',
    patientId: 'PT-2025-2003',
    age: '28',
    gender: 'Female',
    collectedDate: 'October 24, 2025',
    reportedDate: 'October 24, 2025',
    tests: [
      { parameter: 'Color', result: 'Pale Yellow', unit: '' },
      { parameter: 'Appearance', result: 'Slightly Cloudy', unit: '' },
      { parameter: 'pH', result: '7.8', unit: '' },
      { parameter: 'Specific Gravity', result: '1.018', unit: '' },
      { parameter: 'Protein', result: 'Trace', unit: '' },
      { parameter: 'Glucose', result: 'Negative', unit: '' },
      { parameter: 'Ketones', result: 'Negative', unit: '' },
      { parameter: 'Blood', result: 'Positive', unit: '' },
      { parameter: 'WBC', result: '12', unit: '/HPF' },
      { parameter: 'RBC', result: '8', unit: '/HPF' },
      { parameter: 'Epithelial Cells', result: '4', unit: '/HPF' },
      { parameter: 'Bacteria', result: 'Few', unit: '' }
    ]
  },
  {
    filename: 'kidney-function-test.png',
    title: 'RENAL FUNCTION TEST REPORT',
    patientName: 'Mohammed Ali',
    patientId: 'PT-2025-2004',
    age: '68',
    gender: 'Male',
    collectedDate: 'October 19, 2025',
    reportedDate: 'October 20, 2025',
    tests: [
      { parameter: 'Blood Urea Nitrogen (BUN)', result: '32', unit: 'mg/dL' },
      { parameter: 'Creatinine', result: '1.8', unit: 'mg/dL' },
      { parameter: 'Uric Acid', result: '8.2', unit: 'mg/dL' },
      { parameter: 'Sodium', result: '138', unit: 'mEq/L' },
      { parameter: 'Potassium', result: '5.1', unit: 'mEq/L' },
      { parameter: 'Chloride', result: '101', unit: 'mEq/L' }
    ]
  },
  {
    filename: 'diabetes-screening-test.png',
    title: 'DIABETES SCREENING PANEL',
    patientName: 'Lakshmi Iyer',
    patientId: 'PT-2025-2005',
    age: '50',
    gender: 'Female',
    collectedDate: 'October 23, 2025',
    reportedDate: 'October 24, 2025',
    tests: [
      { parameter: 'Fasting Glucose', result: '126', unit: 'mg/dL' },
      { parameter: 'HbA1c', result: '6.8', unit: '%' },
      { parameter: 'Post-Prandial Glucose', result: '185', unit: 'mg/dL' },
      { parameter: 'Insulin (Fasting)', result: '18', unit: 'µU/mL' }
    ]
  },
  {
    filename: 'vitamin-deficiency-test.png',
    title: 'VITAMIN PROFILE TEST REPORT',
    patientName: 'Arjun Patel',
    patientId: 'PT-2025-2006',
    age: '35',
    gender: 'Male',
    collectedDate: 'October 21, 2025',
    reportedDate: 'October 22, 2025',
    tests: [
      { parameter: 'Vitamin D', result: '18', unit: 'ng/mL' },
      { parameter: 'Vitamin B12', result: '165', unit: 'pg/mL' },
      { parameter: 'Folate', result: '3.2', unit: 'ng/mL' },
      { parameter: 'Vitamin B6', result: '15', unit: 'ng/mL' },
      { parameter: 'Iron', result: '45', unit: 'µg/dL' },
      { parameter: 'Ferritin', result: '22', unit: 'ng/mL' }
    ]
  }
];

// Generate each report
labReports.forEach(report => {
  const width = 800;
  const height = 600 + (report.tests.length * 35);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Header - Lab Name
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, width, 60);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HEALTHPLUS DIAGNOSTIC CENTER', width / 2, 38);

  // Lab Address
  ctx.fillStyle = '#333333';
  ctx.font = '12px Arial';
  ctx.fillText('456 Wellness Boulevard, Medical City, MC 67890', width / 2, 85);
  ctx.fillText('Phone: +91-9876543210 | Email: reports@healthplus.com', width / 2, 105);

  // Title
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(report.title, width / 2, 145);

  // Patient Information Box
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 165, width - 80, 120);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('PATIENT INFORMATION', 50, 185);

  ctx.font = '13px Arial';
  ctx.fillText(`Patient Name: ${report.patientName}`, 50, 210);
  ctx.fillText(`Patient ID: ${report.patientId}`, 400, 210);
  ctx.fillText(`Age/Gender: ${report.age} Years / ${report.gender}`, 50, 235);
  ctx.fillText(`Collection Date: ${report.collectedDate}`, 50, 260);
  ctx.fillText(`Report Date: ${report.reportedDate}`, 400, 260);

  // Test Results Table
  let yPos = 320;
  
  // Table Header
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(40, yPos, width - 80, 35);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Test Parameter', 50, yPos + 22);
  ctx.fillText('Result', 400, yPos + 22);
  ctx.fillText('Unit', 550, yPos + 22);

  yPos += 35;

  // Table Rows
  ctx.fillStyle = '#1f2937';
  ctx.font = '13px Arial';
  report.tests.forEach((test, index) => {
    // Alternating row colors
    if (index % 2 === 0) {
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(40, yPos, width - 80, 35);
    }
    
    ctx.fillStyle = '#1f2937';
    ctx.fillText(test.parameter, 50, yPos + 22);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(test.result, 400, yPos + 22);
    ctx.fillStyle = '#1f2937';
    ctx.font = '13px Arial';
    ctx.fillText(test.unit, 550, yPos + 22);
    
    yPos += 35;
  });

  // Footer - Doctor Signature
  yPos += 40;
  ctx.fillStyle = '#374151';
  ctx.font = '13px Arial';
  ctx.fillText('Dr. Sneha Reddy, MD', 50, yPos);
  ctx.fillText('Chief Pathologist', 50, yPos + 20);
  ctx.fillText('License No: MP-67890', 50, yPos + 40);
  
  ctx.textAlign = 'right';
  ctx.font = 'italic 11px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('*** End of Report ***', width - 50, yPos + 60);

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(report.filename, buffer);
  console.log(`✅ Generated: ${report.filename}`);
});

console.log('\n🎉 All lab reports generated successfully!');
