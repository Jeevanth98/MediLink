import Database from 'better-sqlite3';

const db = new Database('./backend/database.sqlite');

const row = db.prepare('SELECT * FROM document_ocr_text WHERE document_id = 7').get();

if (row) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📝 OCR TEXT FOR DOCUMENT 7 (Urine Test):');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(row.extracted_text);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Confidence: ${(row.confidence_score * 100).toFixed(1)}%`);
} else {
  console.log('No OCR data found');
}

db.close();
