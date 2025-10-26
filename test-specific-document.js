import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
  email: 'jeevanthsekar99@gmail.com',
  password: '46D7JADNAU2005j*'
};

let authToken = null;

async function login() {
  console.log('🔐 Logging in...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ Login successful\n');
    return true;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function getMedicalRecords(familyMemberId = 4) {
  console.log(`📋 Fetching medical records for family member ID: ${familyMemberId}\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/medical-records/family-member/${familyMemberId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch records');
    }

    const data = await response.json();
    console.log(`✅ Found ${data.records.length} medical record(s)\n`);
    
    // Display records with files
    data.records.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  Title: ${record.title}`);
      console.log(`  Type: ${record.record_type}`);
      console.log(`  Date: ${record.date}`);
      console.log(`  Files: ${record.files?.length || 0}`);
      
      if (record.files && record.files.length > 0) {
        record.files.forEach((file, fIndex) => {
          console.log(`    File ${fIndex + 1}:`);
          console.log(`      Document ID: ${file.id}`);
          console.log(`      Filename: ${file.original_filename}`);
          console.log(`      Type: ${file.document_type}`);
        });
      }
      console.log('');
    });
    
    // Return the most recent record with files
    const recordWithFiles = data.records.find(r => r.files && r.files.length > 0);
    if (recordWithFiles && recordWithFiles.files.length > 0) {
      return recordWithFiles.files[0].id; // Return first document ID
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching records:', error.message);
    return null;
  }
}

async function analyzeDocument(documentId) {
  console.log('='.repeat(80));
  console.log('🤖 STARTING AI DOCUMENT ANALYSIS');
  console.log('='.repeat(80));
  console.log(`\nDocument ID: ${documentId}`);
  console.log('\nThis will:');
  console.log('  1. 🔍 Extract text using Google Cloud Vision OCR');
  console.log('  2. 🤖 Analyze with Gemini AI');
  console.log('  3. 📊 Generate medical insights\n');
  
  try {
    console.log('⏳ Processing... (this may take 10-15 seconds)\n');
    
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/ai/analyze/document/${documentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Analysis failed:', error);
      console.error('\nError Details:');
      console.error('  Stage:', error.stage || 'unknown');
      console.error('  Message:', error.error || 'unknown');
      
      if (error.ocrText) {
        console.log('\n📝 Extracted OCR Text (partial):');
        console.log('  ' + '-'.repeat(76));
        console.log('  ' + error.ocrText.substring(0, 500).replace(/\n/g, '\n  '));
        console.log('  ' + '-'.repeat(76));
      }
      return false;
    }

    const data = await response.json();
    
    console.log('✅ AI ANALYSIS COMPLETED SUCCESSFULLY!');
    console.log(`⏱️  Processing Time: ${processingTime} seconds\n`);
    console.log('='.repeat(80));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(80));
    
    // Document Information
    console.log('\n📄 Document Information:');
    console.log('  ' + '-'.repeat(76));
    console.log(`  Filename:     ${data.analysis.originalFilename}`);
    console.log(`  Type:         ${data.analysis.documentType}`);
    console.log(`  Patient:      ${data.analysis.familyMemberName}`);
    console.log(`  Document ID:  ${data.analysis.documentId}`);
    console.log('  ' + '-'.repeat(76));
    
    // OCR Results
    console.log('\n📝 OCR EXTRACTION RESULTS:');
    console.log('  ' + '-'.repeat(76));
    console.log(`  Characters Extracted: ${data.analysis.ocrResults.textLength.toLocaleString()}`);
    console.log(`  Confidence Score:     ${(data.analysis.ocrResults.confidence * 100).toFixed(1)}%`);
    console.log('  ' + '-'.repeat(76));
    
    console.log('\n  Extracted Text:');
    console.log('  ' + '═'.repeat(76));
    const extractedText = data.analysis.ocrResults.extractedText;
    const lines = extractedText.split('\n');
    lines.forEach(line => {
      console.log('  │ ' + line);
    });
    console.log('  ' + '═'.repeat(76));
    
    // AI Analysis
    console.log('\n🤖 GEMINI AI ANALYSIS:');
    console.log('  ' + '='.repeat(76));
    const analysisLines = data.analysis.aiAnalysis.fullAnalysis.split('\n');
    analysisLines.forEach(line => {
      console.log('  ' + line);
    });
    console.log('  ' + '='.repeat(76));
    
    // Validation Check
    console.log('\n✅ VALIDATION CHECKS:');
    console.log('  ' + '-'.repeat(76));
    
    const text = extractedText.toLowerCase();
    const analysis = data.analysis.aiAnalysis.fullAnalysis.toLowerCase();
    
    // Check if key information is extracted and analyzed
    const checks = {
      'Patient Name (Tharun)': text.includes('tharun'),
      'Hospital Name': text.includes('diagnostic') || text.includes('center'),
      'Hemoglobin Value (12.8)': text.includes('12.8'),
      'LOW Hemoglobin Identified': analysis.includes('low') || analysis.includes('below'),
      'Anemia Mentioned': analysis.includes('anemia'),
      'Iron Recommendation': analysis.includes('iron'),
      'Follow-up Suggested': analysis.includes('follow'),
      'Patient-Friendly Language': !analysis.includes('erythrocyte') // Should use simple terms
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    console.log('  ' + '-'.repeat(76));
    
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    const passRate = ((passedChecks / totalChecks) * 100).toFixed(0);
    
    console.log(`\n  Overall Validation: ${passedChecks}/${totalChecks} checks passed (${passRate}%)`);
    
    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`  Processing Time:        ${processingTime}s`);
    console.log(`  OCR Accuracy:           ${(data.analysis.ocrResults.confidence * 100).toFixed(1)}%`);
    console.log(`  Text Extracted:         ${data.analysis.ocrResults.textLength} characters`);
    console.log(`  Validation Score:       ${passRate}%`);
    console.log(`  Analysis Timestamp:     ${new Date(data.analysis.analysisTimestamp).toLocaleString()}`);
    console.log('='.repeat(80));
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL CHECKS PASSED! AI Analysis is working perfectly!');
    } else if (passedChecks >= totalChecks * 0.7) {
      console.log('\n✅ MOSTLY PASSED! AI Analysis is working well with minor issues.');
    } else {
      console.log('\n⚠️ SOME CHECKS FAILED! Review the analysis output above.');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Fatal error during analysis:', error.message);
    console.error(error);
    return false;
  }
}

async function runTest() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   🧪 AI DOCUMENT ANALYSIS TEST                            ║');
  console.log('║                        MediLink - Tharun S                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Step 1: Login
  if (!await login()) {
    console.log('\n❌ Test failed at login step');
    return;
  }
  
  // Step 2: Get medical records
  const documentId = await getMedicalRecords(3); // Tharun S's ID is 3
  
  if (!documentId) {
    console.log('\n❌ No documents found for analysis');
    console.log('Please make sure you have uploaded the lab report for Tharun S');
    return;
  }
  
  // Step 3: Analyze document
  await analyzeDocument(documentId);
  
  console.log('\n✅ Test completed!\n');
}

// Run the test
runTest().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
