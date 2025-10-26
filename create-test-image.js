import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a canvas with lab report
const width = 800;
const height = 1000;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// White background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, width, height);

// Header - Blue background
ctx.fillStyle = '#2563eb';
ctx.fillRect(0, 0, width, 80);

// Hospital name
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 28px Arial';
ctx.fillText('🏥 CITY DIAGNOSTIC CENTER', 150, 40);
ctx.font = '14px Arial';
ctx.fillText('123 Medical Street, Healthcare City, HC 12345', 200, 60);

// Title
ctx.fillStyle = '#000000';
ctx.font = 'bold 24px Arial';
ctx.fillText('COMPLETE BLOOD COUNT (CBC) TEST REPORT', 100, 120);

// Patient Info Box
ctx.fillStyle = '#f3f4f6';
ctx.fillRect(50, 150, 700, 150);
ctx.strokeStyle = '#d1d5db';
ctx.strokeRect(50, 150, 700, 150);

ctx.fillStyle = '#000000';
ctx.font = 'bold 14px Arial';
ctx.fillText('Patient Name: Tharun S', 70, 180);
ctx.fillText('Patient ID: PT-2025-1234', 70, 205);
ctx.fillText('Age/Gender: 18 Years / Male', 70, 230);
ctx.fillText('Collected Date: October 25, 2025', 70, 255);
ctx.fillText('Reported Date: October 26, 2025', 70, 280);

// Test Results Header
ctx.fillStyle = '#2563eb';
ctx.fillRect(50, 320, 700, 40);
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 14px Arial';
ctx.fillText('Test Parameter', 70, 345);
ctx.fillText('Result', 300, 345);
ctx.fillText('Reference Range', 420, 345);
ctx.fillText('Status', 630, 345);

// Test Results
const results = [
  { name: 'Hemoglobin', value: '12.8 g/dL', range: '13.5-17.5', status: 'LOW', color: '#dc2626' },
  { name: 'RBC Count', value: '4.5 M/cumm', range: '4.5-5.5', status: 'Normal', color: '#059669' },
  { name: 'WBC Count', value: '8500 /cumm', range: '4000-11000', status: 'Normal', color: '#059669' },
  { name: 'Platelet Count', value: '180000 /cumm', range: '150000-410000', status: 'Normal', color: '#059669' },
  { name: 'Neutrophils', value: '65%', range: '40-80%', status: 'Normal', color: '#059669' },
  { name: 'Lymphocytes', value: '28%', range: '20-40%', status: 'Normal', color: '#059669' },
];

ctx.font = '14px Arial';
let yPos = 380;
results.forEach((result, index) => {
  // Alternate row background
  if (index % 2 === 0) {
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(50, yPos - 20, 700, 35);
  }
  
  ctx.fillStyle = '#000000';
  ctx.fillText(result.name, 70, yPos);
  ctx.fillText(result.value, 300, yPos);
  ctx.fillText(result.range, 420, yPos);
  
  ctx.fillStyle = result.color;
  ctx.font = 'bold 14px Arial';
  ctx.fillText(result.status, 630, yPos);
  ctx.font = '14px Arial';
  
  yPos += 35;
});

// Clinical Notes Box
ctx.fillStyle = '#fef3c7';
ctx.fillRect(50, yPos + 20, 700, 100);
ctx.strokeStyle = '#f59e0b';
ctx.lineWidth = 3;
ctx.strokeRect(50, yPos + 20, 700, 100);

ctx.fillStyle = '#000000';
ctx.font = 'bold 14px Arial';
ctx.fillText('⚠️ CLINICAL NOTES:', 70, yPos + 45);
ctx.font = '13px Arial';
ctx.fillText('Hemoglobin level is slightly below normal range, suggesting mild anemia.', 70, yPos + 70);
ctx.fillText('Recommend iron-rich diet and follow-up testing in 4 weeks.', 70, yPos + 90);
ctx.fillText('Consider iron supplementation if symptoms persist.', 70, yPos + 110);

// Signature
yPos += 160;
ctx.fillStyle = '#000000';
ctx.font = '14px Arial';
ctx.fillText('Dr. Michael Chen, MD', 550, yPos);
ctx.fillText('Chief Pathologist', 550, yPos + 20);
ctx.fillText('License No: MP-12345', 550, yPos + 40);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'test-lab-report.png'), buffer);

console.log('✅ Test lab report image created: test-lab-report.png');
console.log('📊 Image size:', (buffer.length / 1024).toFixed(2), 'KB');
console.log('📐 Dimensions:', width, 'x', height, 'pixels');
