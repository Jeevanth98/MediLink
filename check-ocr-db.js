import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./backend/database.sqlite');

// Check OCR text for document 7
db.get('SELECT * FROM document_ocr_text WHERE document_id = 7', (err, row) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  if (row) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📝 STORED OCR TEXT FOR DOCUMENT 7 (Urine Test):');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(row.extracted_text);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\nConfidence: ${(row.confidence_score * 100).toFixed(1)}%`);
    console.log(`Processing Status: ${row.processing_status}`);
    console.log(`Created: ${row.created_at}`);
  } else {
    console.log('No OCR data found for document 7');
  }

  db.close();
});
