import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - you'll need to update these
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '1234567890',
  age: 30
};

let authToken = null;
let userId = null;
let familyMemberId = null;
let medicalRecordId = null;
let documentId = null;

async function login() {
  console.log('\n🔐 Step 1: Logging in...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (!response.ok) {
      console.log('Login failed, trying to sign up...');
      return await signup();
    }

    const data = await response.json();
    authToken = data.token;
    userId = data.user.id;
    
    console.log('✅ Login successful');
    console.log('User ID:', userId);
    console.log('Token:', authToken.substring(0, 20) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function signup() {
  console.log('\n📝 Signing up new user...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    authToken = data.token;
    userId = data.user.id;
    
    console.log('✅ Signup successful');
    console.log('User ID:', userId);
    
    return true;
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    return false;
  }
}

async function createFamilyMember() {
  console.log('\n👨‍👩‍👧 Step 2: Creating family member...');
  
  try {
    const response = await fetch(`${BASE_URL}/family-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Tharun S',
        gender: 'Male',
        age: 18,
        blood_group: 'O+',
        relationship: 'Sibling',
        phone: '9876543210',
        emergency_contact: '9876543211',
        height: 170,
        weight: 65
      })
    });

    if (!response.ok) {
      // Family member might already exist, try to fetch
      console.log('Family member might exist, fetching list...');
      const listResponse = await fetch(`${BASE_URL}/family-members`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const listData = await listResponse.json();
      if (listData.familyMembers && listData.familyMembers.length > 0) {
        familyMemberId = listData.familyMembers[0].id;
        console.log('✅ Using existing family member:', familyMemberId);
        return true;
      }
      
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    familyMemberId = data.familyMember.id;
    
    console.log('✅ Family member created');
    console.log('Family Member ID:', familyMemberId);
    
    return true;
  } catch (error) {
    console.error('❌ Create family member error:', error.message);
    return false;
  }
}

async function uploadMedicalRecord() {
  console.log('\n📋 Step 3: Creating medical record with lab report...');
  
  try {
    // First, create a simple test image with text
    const testImagePath = path.join(__dirname, 'test-lab-report-simple.txt');
    const labReportText = `
COMPLETE BLOOD COUNT (CBC) TEST REPORT

CITY DIAGNOSTIC CENTER
Patient: Tharun S
Age: 18 Years
Date: October 26, 2025

TEST RESULTS:
--------------
Hemoglobin: 12.8 g/dL (Normal: 13.5-17.5) - LOW
RBC Count: 4.5 million/cumm (Normal: 4.5-5.5) - Normal
WBC Count: 8500 cells/cumm (Normal: 4000-11000) - Normal
Platelet Count: 180000 cells/cumm (Normal: 150000-410000) - Normal

CLINICAL NOTES:
Hemoglobin level is slightly below normal, suggesting mild anemia.
Recommend iron-rich diet and follow-up in 4 weeks.
    `.trim();
    
    fs.writeFileSync(testImagePath, labReportText);
    
    const form = new FormData();
    form.append('family_member_id', familyMemberId.toString());
    form.append('record_type', 'Lab Test');
    form.append('title', 'Complete Blood Count (CBC) Test');
    form.append('date', '2025-10-26');
    form.append('doctor_name', 'Dr. Sarah Johnson');
    form.append('hospital_name', 'City Diagnostic Center');
    form.append('diagnosis', 'Mild Anemia');
    form.append('document_types', 'Lab Report');
    
    // Upload the text file as a medical document
    form.append('documents', fs.createReadStream(testImagePath), {
      filename: 'lab-report.txt',
      contentType: 'text/plain'
    });

    const response = await fetch(`${BASE_URL}/medical-records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    medicalRecordId = data.record.id;
    documentId = data.record.files[0]?.id;
    
    console.log('✅ Medical record created');
    console.log('Record ID:', medicalRecordId);
    console.log('Document ID:', documentId);
    console.log('Files uploaded:', data.record.files.length);
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
    return true;
  } catch (error) {
    console.error('❌ Upload medical record error:', error.message);
    return false;
  }
}

async function testDocumentAnalysis() {
  console.log('\n🤖 Step 4: Testing AI Document Analysis...');
  console.log('This will:');
  console.log('  1. Extract text using Google Cloud Vision OCR');
  console.log('  2. Analyze the text using Gemini AI');
  console.log('  3. Generate medical insights\n');
  
  try {
    const response = await fetch(`${BASE_URL}/ai/analyze/document/${documentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Analysis failed:', error);
      console.error('Error stage:', error.stage);
      if (error.ocrText) {
        console.log('\n📝 Extracted OCR Text:');
        console.log(error.ocrText);
      }
      return false;
    }

    const data = await response.json();
    
    console.log('✅ AI Analysis completed successfully!\n');
    console.log('='.repeat(80));
    console.log('ANALYSIS RESULTS');
    console.log('='.repeat(80));
    
    console.log('\n📄 Document Information:');
    console.log('  - Filename:', data.analysis.originalFilename);
    console.log('  - Type:', data.analysis.documentType);
    console.log('  - Patient:', data.analysis.familyMemberName);
    
    console.log('\n📝 OCR Results:');
    console.log('  - Text Extracted:', data.analysis.ocrResults.textLength, 'characters');
    console.log('  - Confidence Score:', (data.analysis.ocrResults.confidence * 100).toFixed(1) + '%');
    console.log('\n  Extracted Text Preview:');
    console.log('  ' + '-'.repeat(76));
    const preview = data.analysis.ocrResults.extractedText.substring(0, 300);
    console.log('  ' + preview.replace(/\n/g, '\n  '));
    if (data.analysis.ocrResults.extractedText.length > 300) {
      console.log('  ... (truncated)');
    }
    console.log('  ' + '-'.repeat(76));
    
    console.log('\n🤖 AI Analysis:');
    console.log('  ' + '='.repeat(76));
    console.log(data.analysis.aiAnalysis.fullAnalysis.split('\n').map(line => '  ' + line).join('\n'));
    console.log('  ' + '='.repeat(76));
    
    console.log('\n⏰ Analysis Timestamp:', data.analysis.analysisTimestamp);
    console.log('\n' + '='.repeat(80));
    
    return true;
  } catch (error) {
    console.error('❌ Test document analysis error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 MediLink AI Analysis Test Suite');
  console.log('='.repeat(80));
  console.log('This will test the complete AI analysis pipeline:');
  console.log('  ✓ User authentication');
  console.log('  ✓ Family member creation');
  console.log('  ✓ Medical record upload');
  console.log('  ✓ OCR text extraction (Google Cloud Vision)');
  console.log('  ✓ AI medical analysis (Gemini AI)');
  console.log('='.repeat(80));
  
  // Step 1: Login
  if (!await login()) {
    console.log('\n❌ Test suite failed at login step');
    return;
  }
  
  // Step 2: Create family member
  if (!await createFamilyMember()) {
    console.log('\n❌ Test suite failed at family member creation');
    return;
  }
  
  // Step 3: Upload medical record
  if (!await uploadMedicalRecord()) {
    console.log('\n❌ Test suite failed at medical record upload');
    return;
  }
  
  // Step 4: Test AI analysis
  if (!await testDocumentAnalysis()) {
    console.log('\n❌ Test suite failed at AI analysis');
    return;
  }
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - User authenticated: ✓');
  console.log('  - Family member created: ✓');
  console.log('  - Medical record uploaded: ✓');
  console.log('  - OCR text extraction: ✓');
  console.log('  - AI analysis generated: ✓');
  console.log('\n🎉 AI Analysis feature is working correctly!');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
