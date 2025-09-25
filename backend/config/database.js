import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📊 Connected to SQLite database');
  }
});

export const initDatabase = () => {
  // Create users table only if it doesn't exist (preserves existing data)
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      age INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('✅ Users table ready (preserving existing data)');
    }
  });

  // Create family_members table only if it doesn't exist (preserves existing data)
  const createFamilyMembersTable = `
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER NOT NULL,
      blood_group TEXT NOT NULL,
      relationship TEXT NOT NULL,
      phone TEXT,
      emergency_contact TEXT NOT NULL,
      height DECIMAL(5,2),
      weight DECIMAL(5,2),
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  db.run(createFamilyMembersTable, (err) => {
    if (err) {
      console.error('Error creating family_members table:', err.message);
    } else {
      console.log('✅ Family members table ready (preserving existing data)');
    }
  });

  // Create medical_records table only if it doesn't exist (preserves existing data)
  const createMedicalRecordsTable = `
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_member_id INTEGER NOT NULL,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      doctor_name TEXT,
      hospital_name TEXT,
      diagnosis TEXT,
      symptoms TEXT,
      treatment TEXT,
      medications TEXT,
      notes TEXT,
      follow_up_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_member_id) REFERENCES family_members (id) ON DELETE CASCADE
    )
  `;

  db.run(createMedicalRecordsTable, (err) => {
    if (err) {
      console.error('Error creating medical_records table:', err.message);
    } else {
      console.log('✅ Medical records table ready (preserving existing data)');
    }
  });

  // Create medical_documents table only if it doesn't exist (preserves existing data)
  const createMedicalDocumentsTable = `
    CREATE TABLE IF NOT EXISTS medical_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `;

  db.run(createMedicalDocumentsTable, (err) => {
    if (err) {
      console.error('Error creating medical_documents table:', err.message);
    } else {
      console.log('✅ Medical documents table ready (preserving existing data)');
    }
  });
};
