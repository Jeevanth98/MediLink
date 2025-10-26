import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const email = 'jeevanthsekar99@gmail.com';
const password = '123';

async function debugOCR() {
  try {
    // Login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('Login failed');
      return;
    }

    console.log('✅ Logged in successfully\n');

    // Analyze document 7 (urine test)
    console.log('Analyzing Document ID 7 (Urine Test)...\n');
    
    const analysisResponse = await fetch(`${BASE_URL}/api/ai/analyze/document/7`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    const result = await analysisResponse.json();
    
    if (result.success) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📝 EXTRACTED OCR TEXT:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(result.analysis.ocrResults.extractedText);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`\nText Length: ${result.analysis.ocrResults.textLength} characters`);
      console.log(`Confidence: ${(result.analysis.ocrResults.confidence * 100).toFixed(1)}%`);
    } else {
      console.error('Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugOCR();
