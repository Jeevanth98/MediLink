import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMedicalFiles, handleUploadError, deleteFile, getFileUrl } from '../middleware/fileUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all medical records for a family member
router.get('/family-member/:familyMemberId', authenticateToken, (req, res) => {
  try {
    const { familyMemberId } = req.params;

    // First verify the family member belongs to the authenticated user
    const checkOwnershipQuery = `
      SELECT id FROM family_members 
      WHERE id = ? AND user_id = ?
    `;

    db.get(checkOwnershipQuery, [familyMemberId, req.user.userId], (err, familyMember) => {
      if (err) {
        console.error('Database error checking ownership:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!familyMember) {
        return res.status(404).json({ error: 'Family member not found' });
      }

      // Get medical records with file information
      const getRecordsQuery = `
        SELECT mr.*, 
               md.id as doc_id, md.filename, md.original_filename, 
               md.file_type, md.file_size, md.document_type, md.description as file_description
        FROM medical_records mr
        LEFT JOIN medical_documents md ON mr.id = md.record_id
        WHERE mr.family_member_id = ? 
        ORDER BY mr.date DESC, mr.created_at DESC
      `;

      db.all(getRecordsQuery, [familyMemberId], (err, rows) => {
        if (err) {
          console.error('Database error fetching records:', err);
          return res.status(500).json({ error: 'Failed to fetch medical records' });
        }

        // Process results to group files with records
        const recordsMap = new Map();
        
        rows.forEach(row => {
          if (!recordsMap.has(row.id)) {
            recordsMap.set(row.id, {
              ...row,
              files: []
            });
            // Remove file-related fields from main record
            const record = recordsMap.get(row.id);
            delete record.doc_id;
            delete record.filename;
            delete record.original_filename;
            delete record.file_type;
            delete record.file_size;
            delete record.file_description;
          }
          
          // Add file if it exists
          if (row.doc_id) {
            recordsMap.get(row.id).files.push({
              id: row.doc_id,
              filename: row.filename,
              original_filename: row.original_filename,
              file_type: row.file_type,
              file_size: row.file_size,
              document_type: row.document_type,
              description: row.file_description,
              url: getFileUrl(row.filename)
            });
          }
        });

        const records = Array.from(recordsMap.values());

        res.json({
          message: 'Medical records retrieved successfully',
          records: records || []
        });
      });
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific medical record
router.get('/:recordId', authenticateToken, (req, res) => {
  try {
    const { recordId } = req.params;

    const getRecordQuery = `
      SELECT mr.*, fm.name as family_member_name,
             md.id as doc_id, md.filename, md.original_filename, 
             md.file_type, md.file_size, md.document_type, md.description as file_description
      FROM medical_records mr
      JOIN family_members fm ON mr.family_member_id = fm.id
      LEFT JOIN medical_documents md ON mr.id = md.record_id
      WHERE mr.id = ? AND fm.user_id = ?
    `;

    db.all(getRecordQuery, [recordId, req.user.userId], (err, rows) => {
      if (err) {
        console.error('Database error fetching record:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Medical record not found' });
      }

      // Process the results
      const record = {
        ...rows[0],
        files: rows
          .filter(row => row.doc_id)
          .map(row => ({
            id: row.doc_id,
            filename: row.filename,
            original_filename: row.original_filename,
            file_type: row.file_type,
            file_size: row.file_size,
            document_type: row.document_type,
            description: row.file_description,
            url: getFileUrl(row.filename)
          }))
      };

      // Remove file-related fields from main record
      delete record.doc_id;
      delete record.filename;
      delete record.original_filename;
      delete record.file_type;
      delete record.file_size;
      delete record.file_description;

      res.json({
        message: 'Medical record retrieved successfully',
        record
      });
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new medical record
router.post('/', authenticateToken, uploadMedicalFiles, (req, res) => {
  try {
    console.log('POST /medical-records - Request received');
    console.log('Body fields:', Object.keys(req.body));
    console.log('Files:', req.files ? req.files.length : 0, 'files');
    if (req.files) {
      req.files.forEach((file, index) => {
        console.log(`File ${index}:`, file.originalname, file.mimetype, file.size);
      });
    }
    const {
      family_member_id,
      record_type,
      title,
      date,
      doctor_name,
      hospital_name,
      diagnosis,
      symptoms,
      treatment,
      medications,
      notes,
      follow_up_date,
      document_types // Array of document types corresponding to uploaded files
    } = req.body;

    console.log('Creating medical record with data:', req.body);
    console.log('Uploaded files:', req.files);

    // Validation
    if (!family_member_id || !record_type || !title || !date) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => deleteFile(file.path));
      }
      return res.status(400).json({
        error: 'family_member_id, record_type, title, and date are required'
      });
    }

    // Check total file size (10MB limit)
    let totalSize = 0;
    if (req.files) {
      totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 10 * 1024 * 1024) { // 10MB
        // Clean up uploaded files
        req.files.forEach(file => deleteFile(file.path));
        return res.status(400).json({ error: 'Total file size exceeds 10MB limit' });
      }
    }

    // Verify the family member belongs to the authenticated user
    const checkOwnershipQuery = `
      SELECT id, name FROM family_members 
      WHERE id = ? AND user_id = ?
    `;

    db.get(checkOwnershipQuery, [family_member_id, req.user.userId], (err, familyMember) => {
      if (err) {
        console.error('Database error checking ownership:', err);
        // Clean up uploaded files
        if (req.files) {
          req.files.forEach(file => deleteFile(file.path));
        }
        return res.status(500).json({ error: 'Database error' });
      }

      if (!familyMember) {
        // Clean up uploaded files
        if (req.files) {
          req.files.forEach(file => deleteFile(file.path));
        }
        return res.status(404).json({ error: 'Family member not found' });
      }

      // Insert medical record
      const insertQuery = `
        INSERT INTO medical_records (
          family_member_id, record_type, title, date, doctor_name,
          hospital_name, diagnosis, symptoms, treatment, medications,
          notes, follow_up_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        family_member_id,
        record_type,
        title,
        date,
        doctor_name || null,
        hospital_name || null,
        diagnosis || null,
        symptoms || null,
        treatment || null,
        medications || null,
        notes || null,
        follow_up_date || null
      ];

      db.run(insertQuery, values, function(err) {
        if (err) {
          console.error('Database error creating record:', err);
          // Clean up uploaded files
          if (req.files) {
            req.files.forEach(file => deleteFile(file.path));
          }
          return res.status(500).json({ error: 'Failed to create medical record' });
        }

        const recordId = this.lastID;
        console.log('Medical record created with ID:', recordId);

        // Insert file records if files were uploaded
        if (req.files && req.files.length > 0) {
          const fileInserts = req.files.map((file, index) => {
            return new Promise((resolve, reject) => {
              const fileQuery = `
                INSERT INTO medical_documents (
                  record_id, filename, original_filename, file_path, 
                  file_type, file_size, document_type, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `;
              
              // Get document type for this file (default to 'Others' if not provided)
              const documentTypes = Array.isArray(req.body.document_types) 
                ? req.body.document_types 
                : (req.body.document_types ? [req.body.document_types] : []);
              const documentType = documentTypes[index] || 'Others';
              
              db.run(fileQuery, [
                recordId,
                file.filename,
                file.originalname,
                file.path,
                file.mimetype,
                file.size,
                documentType,
                `Uploaded document: ${file.originalname}`
              ], function(fileErr) {
                if (fileErr) {
                  console.error('Error saving file record:', fileErr);
                  reject(fileErr);
                } else {
                  console.log('File record saved with ID:', this.lastID);
                  resolve(this.lastID);
                }
              });
            });
          });

          Promise.all(fileInserts)
            .then(() => {
              // Get the created record with files
              fetchRecordWithFiles(recordId, familyMember.name, res);
            })
            .catch((fileError) => {
              console.error('Error saving file records:', fileError);
              res.status(500).json({ error: 'Record created but failed to save file information' });
            });
        } else {
          // No files, just return the record
          fetchRecordWithFiles(recordId, familyMember.name, res);
        }
      });
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => deleteFile(file.path));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a medical record
router.put('/:recordId', authenticateToken, uploadMedicalFiles, (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      record_type,
      title,
      date,
      doctor_name,
      hospital_name,
      diagnosis,
      symptoms,
      treatment,
      medications,
      notes,
      follow_up_date,
      removedFileIds = []
    } = req.body;

    // Validation
    if (!record_type || !title || !date) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            console.error('Error removing file after validation error:', unlinkErr);
          }
        });
      }
      return res.status(400).json({
        error: 'record_type, title, and date are required'
      });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Verify the record belongs to the authenticated user
      const checkOwnershipQuery = `
        SELECT mr.id FROM medical_records mr
        JOIN family_members fm ON mr.family_member_id = fm.id
        WHERE mr.id = ? AND fm.user_id = ?
      `;

      db.get(checkOwnershipQuery, [recordId, req.user.userId], (err, record) => {
        if (err) {
          console.error('Database error checking ownership:', err);
          return db.run('ROLLBACK', () => {
            res.status(500).json({ error: 'Database error' });
          });
        }

        if (!record) {
          // Clean up uploaded files
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              try {
                fs.unlinkSync(file.path);
              } catch (unlinkErr) {
                console.error('Error removing file:', unlinkErr);
              }
            });
          }
          return db.run('ROLLBACK', () => {
            res.status(404).json({ error: 'Medical record not found' });
          });
        }

        // Update the record
        const updateQuery = `
          UPDATE medical_records 
          SET record_type = ?, title = ?, date = ?, doctor_name = ?,
              hospital_name = ?, diagnosis = ?, symptoms = ?, treatment = ?,
              medications = ?, notes = ?, follow_up_date = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        const values = [
          record_type,
          title,
          date,
          doctor_name || null,
          hospital_name || null,
          diagnosis || null,
          symptoms || null,
          treatment || null,
          medications || null,
          notes || null,
          follow_up_date || null,
          recordId
        ];

        db.run(updateQuery, values, function(updateErr) {
          if (updateErr) {
            console.error('Database error updating record:', updateErr);
            return db.run('ROLLBACK', () => {
              res.status(500).json({ error: 'Failed to update medical record' });
            });
          }

          // Handle file operations
          const parsedRemovedIds = Array.isArray(removedFileIds) ? removedFileIds : 
                                 (removedFileIds ? removedFileIds.split(',').filter(id => id.trim()) : []);

          let pendingOperations = 0;
          let operationErrors = [];

          const completeOperation = () => {
            pendingOperations--;
            if (pendingOperations === 0) {
              if (operationErrors.length > 0) {
                console.error('Errors during file operations:', operationErrors);
                return db.run('ROLLBACK', () => {
                  res.status(500).json({ error: 'Error managing files' });
                });
              }

              // Commit transaction
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('Error committing transaction:', commitErr);
                  return res.status(500).json({ error: 'Transaction error' });
                }

                // Fetch updated record with files
                fetchRecordWithFiles(recordId, req.user.userId, (fetchErr, record) => {
                  if (fetchErr || !record) {
                    console.error('Error fetching updated record:', fetchErr);
                    return res.status(500).json({ error: 'Record updated but error fetching result' });
                  }

                  res.json({
                    message: 'Medical record updated successfully',
                    record
                  });
                });
              });
            }
          };

          // Remove old files if specified
          if (parsedRemovedIds.length > 0) {
            pendingOperations++;

            // Get file info before deleting from database
            const getFilesQuery = `SELECT filename FROM medical_documents WHERE id IN (${parsedRemovedIds.map(() => '?').join(',')}) AND record_id = ?`;
            
            db.all(getFilesQuery, [...parsedRemovedIds, recordId], (getErr, filesToDelete) => {
              if (getErr) {
                operationErrors.push(getErr);
                return completeOperation();
              }

              // Delete from database first
              const deleteFilesQuery = `DELETE FROM medical_documents WHERE id IN (${parsedRemovedIds.map(() => '?').join(',')}) AND record_id = ?`;
              
              db.run(deleteFilesQuery, [...parsedRemovedIds, recordId], (delErr) => {
                if (delErr) {
                  operationErrors.push(delErr);
                  return completeOperation();
                }

                // Delete physical files
                filesToDelete.forEach(fileInfo => {
                  const filePath = path.join(__dirname, '../uploads/medical-records', fileInfo.filename);
                  try {
                    if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                    }
                  } catch (unlinkErr) {
                    console.error('Error deleting physical file:', unlinkErr);
                  }
                });

                completeOperation();
              });
            });
          }

          // Add new files if any
          if (req.files && req.files.length > 0) {
            pendingOperations++;

            let fileInsertCount = 0;
            const totalFiles = req.files.length;

            req.files.forEach((file, index) => {
              const insertFileQuery = `
                INSERT INTO medical_documents (record_id, filename, original_filename, file_type, file_size)
                VALUES (?, ?, ?, ?, ?)
              `;

              db.run(insertFileQuery, [
                recordId,
                file.filename,
                file.originalname,
                file.mimetype,
                file.size
              ], (fileErr) => {
                if (fileErr) {
                  operationErrors.push(fileErr);
                }

                fileInsertCount++;
                if (fileInsertCount === totalFiles) {
                  completeOperation();
                }
              });
            });
          }

          // If no file operations needed, complete immediately
          if (pendingOperations === 0) {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('Error committing transaction:', commitErr);
                return res.status(500).json({ error: 'Transaction error' });
              }

              // Fetch updated record with files
              fetchRecordWithFiles(recordId, req.user.userId, (fetchErr, record) => {
                if (fetchErr || !record) {
                  console.error('Error fetching updated record:', fetchErr);
                  return res.status(500).json({ error: 'Record updated but error fetching result' });
                }

                res.json({
                  message: 'Medical record updated successfully',
                  record
                });
              });
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    // Clean up uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          console.error('Error removing file after error:', unlinkErr);
        }
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a medical record
router.delete('/:recordId', authenticateToken, (req, res) => {
  try {
    const { recordId } = req.params;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Verify the record belongs to the authenticated user
      const checkOwnershipQuery = `
        SELECT mr.id FROM medical_records mr
        JOIN family_members fm ON mr.family_member_id = fm.id
        WHERE mr.id = ? AND fm.user_id = ?
      `;

      db.get(checkOwnershipQuery, [recordId, req.user.userId], (err, record) => {
        if (err) {
          console.error('Database error checking ownership:', err);
          return db.run('ROLLBACK', () => {
            res.status(500).json({ error: 'Database error' });
          });
        }

        if (!record) {
          return db.run('ROLLBACK', () => {
            res.status(404).json({ error: 'Medical record not found' });
          });
        }

        // First, get all associated files to delete them from disk
        const getFilesQuery = `SELECT filename FROM medical_documents WHERE record_id = ?`;
        
        db.all(getFilesQuery, [recordId], (getErr, filesToDelete) => {
          if (getErr) {
            console.error('Error getting files for deletion:', getErr);
            return db.run('ROLLBACK', () => {
              res.status(500).json({ error: 'Database error' });
            });
          }

          // Delete files from database first
          db.run('DELETE FROM medical_documents WHERE record_id = ?', [recordId], (fileDelErr) => {
            if (fileDelErr) {
              console.error('Error deleting file records:', fileDelErr);
              return db.run('ROLLBACK', () => {
                res.status(500).json({ error: 'Failed to delete file records' });
              });
            }

            // Delete the medical record
            db.run('DELETE FROM medical_records WHERE id = ?', [recordId], function(recordDelErr) {
              if (recordDelErr) {
                console.error('Database error deleting record:', recordDelErr);
                return db.run('ROLLBACK', () => {
                  res.status(500).json({ error: 'Failed to delete medical record' });
                });
              }

              // Commit the transaction
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('Error committing delete transaction:', commitErr);
                  return res.status(500).json({ error: 'Transaction error' });
                }

                // Delete physical files after successful database deletion
                filesToDelete.forEach(fileInfo => {
                  const filePath = path.join(__dirname, '../uploads/medical-records', fileInfo.filename);
                  try {
                    if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                    }
                  } catch (unlinkErr) {
                    console.error('Error deleting physical file:', unlinkErr);
                    // Don't fail the request if file deletion fails
                  }
                });

                res.json({
                  message: 'Medical record deleted successfully'
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get medical records statistics for a user
router.get('/stats/user', authenticateToken, (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN record_type = 'Checkup' THEN 1 END) as checkups,
        COUNT(CASE WHEN record_type = 'Lab Test' THEN 1 END) as lab_tests,
        COUNT(CASE WHEN record_type = 'Consultation' THEN 1 END) as consultations,
        COUNT(CASE WHEN record_type = 'Emergency Visit' THEN 1 END) as emergencies
      FROM medical_records mr
      JOIN family_members fm ON mr.family_member_id = fm.id
      WHERE fm.user_id = ?
    `;

    db.get(statsQuery, [req.user.userId], (err, stats) => {
      if (err) {
        console.error('Database error fetching stats:', err);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }

      res.json({
        message: 'Statistics retrieved successfully',
        stats: stats || {
          total_records: 0,
          checkups: 0,
          lab_tests: 0,
          consultations: 0,
          emergencies: 0
        }
      });
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to fetch record with files
const fetchRecordWithFiles = (recordId, familyMemberName, res) => {
  const recordQuery = `
    SELECT mr.*, 
           md.id as doc_id, md.filename, md.original_filename, 
           md.file_type, md.file_size, md.document_type, md.description as file_description
    FROM medical_records mr
    LEFT JOIN medical_documents md ON mr.id = md.record_id
    WHERE mr.id = ?
  `;

  db.all(recordQuery, [recordId], (err, rows) => {
    if (err) {
      console.error('Error fetching record with files:', err);
      return res.status(500).json({ error: 'Record created but failed to retrieve' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Process the results
    const record = {
      ...rows[0],
      family_member_name: familyMemberName,
      files: rows
        .filter(row => row.doc_id)
        .map(row => ({
          id: row.doc_id,
          filename: row.filename,
          original_filename: row.original_filename,
          file_type: row.file_type,
          file_size: row.file_size,
          document_type: row.document_type,
          description: row.file_description,
          url: getFileUrl(row.filename)
        }))
    };

    // Remove file-related fields from main record
    delete record.doc_id;
    delete record.filename;
    delete record.original_filename;
    delete record.file_type;
    delete record.file_size;
    delete record.file_description;

    res.status(201).json({
      message: 'Medical record created successfully',
      record
    });
  });
};

export default router;