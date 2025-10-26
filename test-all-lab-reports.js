import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

// Test credentials
const credentials = {
  email: 'jeevanthsekar99@gmail.com',
  password: '46D7JADNAU2005j*'
};

// Lab reports to test
const labReports = [
  { file: 'lipid-profile-report.png', patientName: 'Priya Kumar', type: 'Lab Report' },
  { file: 'thyroid-function-test.png', patientName: 'Rajesh Sharma', type: 'Lab Report' },
  { file: 'urine-routine-test.png', patientName: 'Ananya Desai', type: 'Lab Report' },
  { file: 'kidney-function-test.png', patientName: 'Mohammed Ali', type: 'Lab Report' },
  { file: 'diabetes-screening-test.png', patientName: 'Lakshmi Iyer', type: 'Lab Report' },
  { file: 'vitamin-deficiency-test.png', patientName: 'Arjun Patel', type: 'Lab Report' }
];

console.log('\n' + '═'.repeat(80));
console.log('🧪 TESTING ALL LAB REPORTS WITH AI ANALYSIS');
console.log('═'.repeat(80) + '\n');

async function testAllReports() {
  try {
    // 1. Login
    console.log('🔐 Logging in...\n');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ Login successful\n');

    // 2. Get family member ID 3 (Tharun S)
    const familyMemberId = 3;

    // 3. Upload and analyze each report
    for (let i = 0; i < labReports.length; i++) {
      const report = labReports[i];
      
      console.log('═'.repeat(80));
      console.log(`📄 REPORT ${i + 1}/${labReports.length}: ${report.file}`);
      console.log(`👤 Patient: ${report.patientName}`);
      console.log('═'.repeat(80) + '\n');

      // Create medical record
      const recordData = {
        family_member_id: familyMemberId,
        record_type: 'Lab Test',
        title: `Lab Test - ${report.patientName}`,
        description: `Automated test for ${report.file}`,
        record_date: new Date().toISOString().split('T')[0]
      };

      const recordResponse = await fetch(`${BASE_URL}/api/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      });

      const recordResult = await recordResponse.json();
      const recordId = recordResult.id;
      console.log(`✅ Created medical record ID: ${recordId}`);

      // Upload document
      const formData = new FormData();
      formData.append('files', fs.createReadStream(report.file));
      formData.append('document_type', report.type);

      const uploadResponse = await fetch(`${BASE_URL}/api/medical-records/${recordId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      const documentId = uploadResult[0].id;
      console.log(`✅ Uploaded document ID: ${documentId}\n`);

      // Analyze document
      console.log('🤖 Starting AI Analysis...\n');
      const analysisResponse = await fetch(`${BASE_URL}/api/ai/analyze/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const analysisResult = await analysisResponse.json();

      if (analysisResult.success) {
        console.log('✅ AI ANALYSIS COMPLETED!\n');
        console.log('📊 ANALYSIS RESULTS:');
        console.log('─'.repeat(80));
        console.log(analysisResult.analysis.full_analysis);
        console.log('─'.repeat(80) + '\n');
      } else {
        console.log('❌ Analysis failed:', analysisResult.error);
      }

      // Small delay between reports
      if (i < labReports.length - 1) {
        console.log('⏳ Waiting before next report...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 ALL LAB REPORTS TESTED SUCCESSFULLY!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testAllReports();
