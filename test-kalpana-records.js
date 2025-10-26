import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test credentials
const credentials = {
  email: 'jeevanthsekar99@gmail.com',
  password: '46D7JADNAU2005j*'
};

// Kalpana's documents to test
const kalpanaDocuments = [
  { documentId: 7, filename: 'urine-routine-test.png', title: 'Urine Test' },
  { documentId: 8, filename: 'lipid-profile-report.png', title: 'Lipid Profile' },
  { documentId: 9, filename: 'vitamin-deficiency-test.png', title: 'Vitamin Test' },
  { documentId: 10, filename: 'diabetes-screening-test.png', title: 'Diabetes Screening' }
];

console.log('\n' + '═'.repeat(80));
console.log('🧪 TESTING KALPANA\'S MEDICAL RECORDS - AI ANALYSIS');
console.log('👤 Patient: Kalpana (45 years, Parent)');
console.log('═'.repeat(80) + '\n');

async function testKalpanaRecords() {
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
    console.log('✅ Login successful\n');

    // 2. Test each document
    for (let i = 0; i < kalpanaDocuments.length; i++) {
      const doc = kalpanaDocuments[i];
      
      console.log('═'.repeat(80));
      console.log(`📄 TESTING DOCUMENT ${i + 1}/${kalpanaDocuments.length}`);
      console.log(`📋 Title: ${doc.title}`);
      console.log(`🆔 Document ID: ${doc.documentId}`);
      console.log(`📁 File: ${doc.filename}`);
      console.log('═'.repeat(80) + '\n');

      // Analyze document
      console.log('🤖 Starting AI Analysis...\n');
      const startTime = Date.now();
      
      const analysisResponse = await fetch(`${BASE_URL}/api/ai/analyze/document/${doc.documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const analysisResult = await analysisResponse.json();
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

      if (analysisResult.success) {
        console.log(`✅ AI ANALYSIS COMPLETED! (${processingTime}s)\n`);
        
        const ocr = analysisResult.analysis?.ocrResults;
        const ai = analysisResult.analysis?.aiAnalysis;
        
        console.log('📊 OCR EXTRACTION:');
        console.log('─'.repeat(80));
        console.log(`Characters Extracted: ${ocr?.textLength || 0}`);
        console.log(`Confidence: ${((ocr?.confidence || 0) * 100).toFixed(1)}%`);
        console.log('─'.repeat(80) + '\n');

        console.log('🤖 AI ANALYSIS RESULTS:');
        console.log('─'.repeat(80));
        console.log(ai?.fullAnalysis || 'No analysis available');
        console.log('─'.repeat(80) + '\n');

        console.log('✅ KEY FINDINGS:');
        console.log(ai?.keyFindings || 'No specific findings extracted');
        console.log('');

        console.log('💡 RECOMMENDATIONS:');
        console.log(ai?.recommendations || 'No specific recommendations');
        console.log('');

      } else {
        console.log('❌ Analysis failed:', analysisResult.error);
        if (analysisResult.ocrText) {
          console.log('\n📝 OCR Text (partial):');
          console.log(analysisResult.ocrText.substring(0, 500));
        }
      }

      // Delay between documents
      if (i < kalpanaDocuments.length - 1) {
        console.log('⏳ Waiting 3 seconds before next analysis...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 ALL 4 DOCUMENTS ANALYZED SUCCESSFULLY!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testKalpanaRecords();
