import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve medical record files
router.get('/medical-records/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'medical-records', filename);
    
    console.log('File download request for:', filename);
    console.log('Full file path:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // Get original filename from database
    const getFileQuery = `SELECT original_filename, file_type FROM medical_documents WHERE filename = ?`;
    
    db.get(getFileQuery, [filename], (err, fileRecord) => {
      if (err) {
        console.error('Error fetching file record:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(filename).toLowerCase();
      
      // Set appropriate content type
      let contentType = fileRecord?.file_type || 'application/octet-stream';
      
      // Get original filename (fallback to parsing filename if not in DB)
      let originalName = fileRecord?.original_filename || filename;
      if (!fileRecord) {
        // Fallback: extract from the generated filename (format: timestamp-randomnumber-originalname)
        const parts = filename.split('-');
        if (parts.length >= 3) {
          originalName = parts.slice(2).join('-');
        }
      }
      
      console.log('Serving file:', filename);
      console.log('Original name:', originalName);
      console.log('Content type:', contentType);
      console.log('File size:', stats.size);
      
      // Set headers based on file type
      if (contentType === 'application/pdf') {
        // For PDFs, allow inline viewing first, but include download filename
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      } else if (contentType.startsWith('image/')) {
        // For images, allow inline viewing
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      } else {
        // For other documents, force download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      }
      
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (streamErr) => {
        console.error('Error streaming file:', streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
      
      fileStream.on('open', () => {
        console.log('File stream opened successfully');
      });
      
      fileStream.on('end', () => {
        console.log('File streaming completed');
      });
      
      fileStream.pipe(res);
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error serving file' });
    }
  }
});

export default router;