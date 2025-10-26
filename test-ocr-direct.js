import Tesseract from 'tesseract.js';

const imagePath = './backend/uploads/medical-records/1761502088880-833706277-urine-routine-test.png';

console.log('🔍 Extracting text from urine test image...\n');

Tesseract.recognize(
  imagePath,
  'eng',
  {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        process.stdout.write(`\r📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  }
).then(result => {
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📝 EXTRACTED TEXT:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(result.data.text);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\nConfidence: ${result.data.confidence.toFixed(1)}%`);
  console.log(`Text Length: ${result.data.text.length} characters`);
  
  // Check for keywords
  const keywords = ['hemoglobin', 'glucose', 'cholesterol', 'platelet', 'wbc', 'rbc', 'urine', 'blood test', 'protein'];
  console.log('\n🔍 Keyword Detection:');
  keywords.forEach(keyword => {
    const found = result.data.text.toLowerCase().includes(keyword);
    console.log(`  ${found ? '✓' : '✗'} ${keyword}`);
  });
}).catch(err => {
  console.error('Error:', err);
});
