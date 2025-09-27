import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Token verification for query parameters (for iframe viewing)
const verifyTokenFromQuery = (req, res, next) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).send('<h1>Access denied. No token provided.</h1>');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).send('<h1>Invalid token.</h1>');
  }
};

// Direct file viewer route (for PDFs and images in iframe)
router.get('/view/:filename', async (req, res) => {
  try {
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Access Denied</h1>
            <p>Authentication token is required.</p>
          </body>
        </html>
      `);
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Invalid Token</h1>
            <p>The provided authentication token is invalid.</p>
          </body>
        </html>
      `);
    }

    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'medical-records', filename);
    
    console.log('Direct view request for:', filename);
    console.log('User ID:', decoded.userId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>File Not Found</h1>
            <p>The requested file could not be located.</p>
          </body>
        </html>
      `);
    }

    const ext = path.extname(filename).toLowerCase();
    const fileUrl = `/api/files/medical-records/${filename}?token=${token}`;
    
    if (ext === '.pdf') {
      // PDF viewer with multiple fallback options
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PDF Viewer - ${filename}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: #525659; 
              font-family: Arial, sans-serif;
            }
            .container { 
              width: 100vw; 
              height: 100vh; 
              display: flex;
              flex-direction: column;
            }
            .toolbar {
              background: #404040;
              color: white;
              padding: 10px;
              text-align: center;
            }
            .viewer {
              flex: 1;
              border: none;
              width: 100%;
              height: 100%;
            }
            .fallback {
              text-align: center;
              padding: 20px;
              color: white;
            }
            .download-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="toolbar">
              <strong>PDF Document: ${filename}</strong>
              <a href="${fileUrl}" download class="download-btn">Download PDF</a>
            </div>
            <object 
              class="viewer" 
              data="${fileUrl}" 
              type="application/pdf"
              onload="console.log('PDF loaded successfully')"
            >
              <embed 
                src="${fileUrl}" 
                type="application/pdf" 
                width="100%" 
                height="100%"
              />
              <div class="fallback">
                <h2>PDF Viewer</h2>
                <p>Your browser doesn't support embedded PDF viewing.</p>
                <a href="${fileUrl}" class="download-btn">Download PDF</a>
                <p><small>If download doesn't work, try opening in a new tab: <a href="${fileUrl}" target="_blank" style="color: #007bff;">${filename}</a></small></p>
              </div>
            </object>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      // Image viewer
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Image Viewer - ${filename}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              background: #f8f9fa; 
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .container {
              max-width: 100%;
              margin: 0 auto;
            }
            .header {
              margin-bottom: 20px;
              padding: 10px;
              background: white;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .image-container {
              background: white;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              display: inline-block;
            }
            img { 
              max-width: 100%; 
              max-height: 80vh; 
              height: auto;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              border-radius: 4px;
            }
            .download-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              text-decoration: none;
              display: inline-block;
              margin: 0 5px;
            }
            .error {
              color: #dc3545;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Medical Record Image</h2>
              <strong>${filename}</strong>
              <br><br>
              <a href="${fileUrl}" download class="download-btn">Download Image</a>
            </div>
            <div class="image-container">
              <img 
                src="${fileUrl}" 
                alt="Medical Record Image"
                onload="console.log('Image loaded successfully')"
                onerror="this.parentElement.innerHTML='<div class=error><h3>Error Loading Image</h3><p>Could not load the image file.</p><a href=\\'${fileUrl}\\' class=\\'download-btn\\'>Try Download</a></div>'"
              />
            </div>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      
    } else {
      // Redirect to download for other file types
      res.redirect(fileUrl);
    }
    
  } catch (error) {
    console.error('Error in direct viewer:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Error</h1>
          <p>An error occurred while loading the file.</p>
          <p><small>${error.message}</small></p>
        </body>
      </html>
    `);
  }
});

// Serve medical record files
router.get('/medical-records/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'medical-records', filename);
    
    console.log('File request for:', filename);
    console.log('User ID:', req.user?.userId);
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
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
      
      // Set headers based on file type
      if (contentType === 'application/pdf') {
        // For PDFs, allow inline viewing first, but include download filename
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
        res.setHeader('Cache-Control', 'no-cache'); // Disable cache for auth files
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (contentType.startsWith('image/')) {
        // For images, allow inline viewing
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
        res.setHeader('Cache-Control', 'no-cache'); // Disable cache for auth files
      } else {
        // For other documents, force download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      }
      
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