import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';
import { AIService } from '../services/aiService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Test route to check if AI endpoints are working
 */
router.get('/test', authenticateToken, (req, res) => {
  res.json({ 
    message: 'AI Analysis routes are working!', 
    timestamp: new Date().toISOString(),
    user: req.user.email 
  });
});

/**
 * GET /api/ai/analyze/document/:documentId
 * Analyze a single document with OCR and AI
 */
router.post('/analyze/document/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Starting document analysis for document ID:', documentId);

    // Get document details and verify ownership
    const documentQuery = `
      SELECT md.*, mr.family_member_id, fm.user_id, fm.name as family_member_name
      FROM medical_documents md
      JOIN medical_records mr ON md.record_id = mr.id
      JOIN family_members fm ON mr.family_member_id = fm.id
      WHERE md.id = ? AND fm.user_id = ?
    `;

    db.get(documentQuery, [documentId, userId], async (err, document) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!document) {
        return res.status(404).json({ error: 'Document not found or access denied' });
      }

      // Check file size (5MB limit)
      const fileSizeInMB = AIService.getFileSizeInMB(document.file_path);
      if (fileSizeInMB > 5) {
        return res.status(400).json({ 
          error: 'File too large for AI analysis. Maximum size is 5MB.' 
        });
      }

      // Check if file is processable
      if (!AIService.isFileProcessable(document.file_path, document.file_type)) {
        return res.status(400).json({ 
          error: 'File type not supported for AI analysis. Supported types: Images (JPEG, PNG, etc.) and PDFs.' 
        });
      }

      try {
        // Step 1: Extract text with OCR
        console.log('🔍 Extracting text from document...');
        const ocrResult = await AIService.extractTextFromImage(document.file_path);
        
        if (!ocrResult.success) {
          // Store OCR failure
          const insertOcrQuery = `
            INSERT INTO document_ocr_text (document_id, extracted_text, confidence_score, processing_status, error_message)
            VALUES (?, '', 0, 'failed', ?)
          `;
          
          db.run(insertOcrQuery, [documentId, ocrResult.error], (insertErr) => {
            if (insertErr) {
              console.error('Error storing OCR failure:', insertErr);
            }
          });

          return res.status(400).json({ 
            error: `OCR failed: ${ocrResult.error}`,
            stage: 'text_extraction'
          });
        }

        // Store OCR results
        console.log('💾 Storing OCR results...');
        const insertOcrQuery = `
          INSERT OR REPLACE INTO document_ocr_text (document_id, extracted_text, confidence_score, processing_status, error_message)
          VALUES (?, ?, ?, 'completed', NULL)
        `;
        
        db.run(insertOcrQuery, [documentId, ocrResult.text, ocrResult.confidence], async (insertErr) => {
          if (insertErr) {
            console.error('Error storing OCR results:', insertErr);
            return res.status(500).json({ error: 'Failed to store OCR results' });
          }

          try {
            // Step 2: Analyze with Gemini AI
            console.log('🤖 Analyzing document with Gemini AI...');
            const aiResult = await AIService.analyzeDocument(
              document.document_type || 'Others',
              ocrResult.text,
              document.original_filename
            );

            if (!aiResult.success) {
              return res.status(400).json({ 
                error: `AI analysis failed: ${aiResult.error}`,
                stage: 'ai_analysis',
                ocrText: ocrResult.text // Include extracted text for debugging
              });
            }

            // Store AI analysis results
            console.log('💾 Storing AI analysis results...');
            const insertAiQuery = `
              INSERT OR REPLACE INTO ai_analysis_results 
              (document_id, family_member_id, analysis_type, input_text, ai_response, key_findings, recommendations, analysis_timestamp)
              VALUES (?, ?, 'individual_document', ?, ?, ?, ?, datetime('now'))
            `;

            db.run(insertAiQuery, [
              documentId, 
              document.family_member_id,
              ocrResult.text,
              aiResult.fullAnalysis,
              aiResult.keyFindings,
              aiResult.recommendations
            ], (aiInsertErr) => {
              if (aiInsertErr) {
                console.error('Error storing AI results:', aiInsertErr);
                return res.status(500).json({ error: 'Failed to store AI analysis results' });
              }

              console.log('✅ Document analysis completed successfully');
              
              res.json({
                success: true,
                analysis: {
                  documentId: documentId,
                  familyMemberName: document.family_member_name,
                  originalFilename: document.original_filename,
                  documentType: document.document_type,
                  ocrResults: {
                    extractedText: ocrResult.text,
                    confidence: ocrResult.confidence,
                    textLength: ocrResult.text.length
                  },
                  aiAnalysis: {
                    fullAnalysis: aiResult.fullAnalysis,
                    keyFindings: aiResult.keyFindings,
                    recommendations: aiResult.recommendations
                  },
                  analysisTimestamp: new Date().toISOString()
                }
              });
            });

          } catch (aiError) {
            console.error('AI analysis error:', aiError);
            res.status(500).json({ 
              error: 'AI analysis failed',
              details: aiError.message,
              stage: 'ai_analysis'
            });
          }
        });

      } catch (processingError) {
        console.error('Document processing error:', processingError);
        res.status(500).json({ 
          error: 'Document processing failed',
          details: processingError.message 
        });
      }
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/ai/analyze/health-summary
 * Generate comprehensive health summary for a family member
 */
router.post('/analyze/health-summary', authenticateToken, async (req, res) => {
  try {
    const { familyMemberId, dateRange } = req.body;
    const userId = req.user.id;

    console.log('🏥 Starting health summary generation for family member:', familyMemberId);
    console.log('Request body:', req.body);

    // For now, return a mock response to test if the route works
    return res.status(200).json({
      id: Date.now(),
      analysis: `📋 **Health Summary Test**\n\nThis is a test health summary for family member ID: ${familyMemberId}\n\n✅ **Route Status**: Working correctly\n🔍 **Next Steps**: Integrate with actual AI services\n\n⚠️ Note: This is a mock response to test the API endpoint.`,
      familyMemberId: familyMemberId,
      analysisType: 'health-summary',
      createdAt: new Date().toISOString()
    });

    // Verify family member ownership
    const familyMemberQuery = `
      SELECT * FROM family_members 
      WHERE id = ? AND user_id = ?
    `;

    db.get(familyMemberQuery, [familyMemberId, userId], async (err, familyMember) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!familyMember) {
        return res.status(404).json({ error: 'Family member not found or access denied' });
      }

      try {
        // Get all documents with OCR text for the family member within date range
        let documentsQuery = `
          SELECT md.*, mr.date as record_date, ocr.extracted_text, ocr.confidence_score
          FROM medical_documents md
          JOIN medical_records mr ON md.record_id = mr.id
          LEFT JOIN document_ocr_text ocr ON md.id = ocr.document_id
          WHERE mr.family_member_id = ? AND ocr.extracted_text IS NOT NULL AND ocr.extracted_text != ''
        `;

        let queryParams = [familyMemberId];

        // Add date range filter if provided
        if (dateRangeStart && dateRangeEnd) {
          documentsQuery += ` AND mr.date BETWEEN ? AND ?`;
          queryParams.push(dateRangeStart, dateRangeEnd);
        }

        documentsQuery += ` ORDER BY mr.date DESC`;

        db.all(documentsQuery, queryParams, async (docErr, documents) => {
          if (docErr) {
            console.error('Error fetching documents:', docErr);
            return res.status(500).json({ error: 'Error fetching documents' });
          }

          if (!documents || documents.length === 0) {
            return res.status(400).json({ 
              error: 'No processed documents found for health summary. Please analyze individual documents first using OCR.' 
            });
          }

          console.log(`📄 Found ${documents.length} processed documents for health summary`);

          try {
            // Generate health summary with Gemini AI
            const summaryResult = await AIService.generateHealthSummary(
              familyMember,
              documents,
              dateRangeStart,
              dateRangeEnd
            );

            if (!summaryResult.success) {
              return res.status(400).json({ 
                error: `Health summary generation failed: ${summaryResult.error}` 
              });
            }

            // Store health summary result
            console.log('💾 Storing health summary...');
            const insertSummaryQuery = `
              INSERT INTO ai_analysis_results 
              (family_member_id, analysis_type, ai_response, date_range_start, date_range_end, analysis_timestamp)
              VALUES (?, 'health_summary', ?, ?, ?, datetime('now'))
            `;

            db.run(insertSummaryQuery, [
              familyMemberId,
              summaryResult.healthSummary,
              dateRangeStart,
              dateRangeEnd
            ], (summaryInsertErr) => {
              if (summaryInsertErr) {
                console.error('Error storing health summary:', summaryInsertErr);
                return res.status(500).json({ error: 'Failed to store health summary' });
              }

              console.log('✅ Health summary generated successfully');
              
              res.json({
                success: true,
                healthSummary: {
                  familyMemberId: familyMemberId,
                  familyMemberName: familyMember.name,
                  dateRangeStart: dateRangeStart,
                  dateRangeEnd: dateRangeEnd,
                  documentsAnalyzed: documents.length,
                  summary: summaryResult.healthSummary,
                  generatedAt: new Date().toISOString()
                }
              });
            });

          } catch (summaryError) {
            console.error('Health summary generation error:', summaryError);
            res.status(500).json({ 
              error: 'Health summary generation failed',
              details: summaryError.message 
            });
          }
        });

      } catch (processingError) {
        console.error('Health summary processing error:', processingError);
        res.status(500).json({ 
          error: 'Health summary processing failed',
          details: processingError.message 
        });
      }
    });

  } catch (error) {
    console.error('Health summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/ai/analysis/history/:familyMemberId
 * Get AI analysis history for a family member
 */
router.get('/analysis/history/:familyMemberId', authenticateToken, async (req, res) => {
  try {
    const { familyMemberId } = req.params;
    const userId = req.user.id;

    // Verify family member ownership
    const familyMemberQuery = `
      SELECT name FROM family_members 
      WHERE id = ? AND user_id = ?
    `;

    db.get(familyMemberQuery, [familyMemberId, userId], (err, familyMember) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!familyMember) {
        return res.status(404).json({ error: 'Family member not found or access denied' });
      }

      // Get analysis history
      const historyQuery = `
        SELECT 
          aar.*,
          md.original_filename,
          md.document_type,
          md.uploaded_at
        FROM ai_analysis_results aar
        LEFT JOIN medical_documents md ON aar.document_id = md.id
        WHERE aar.family_member_id = ?
        ORDER BY aar.analysis_timestamp DESC
        LIMIT 50
      `;

      db.all(historyQuery, [familyMemberId], (historyErr, results) => {
        if (historyErr) {
          console.error('Error fetching analysis history:', historyErr);
          return res.status(500).json({ error: 'Error fetching analysis history' });
        }

        // Separate individual document analyses and health summaries
        const documentAnalyses = results.filter(r => r.analysis_type === 'individual_document');
        const healthSummaries = results.filter(r => r.analysis_type === 'health_summary');

        res.json({
          success: true,
          familyMemberName: familyMember.name,
          documentAnalyses: documentAnalyses,
          healthSummaries: healthSummaries,
          totalAnalyses: results.length
        });
      });
    });

  } catch (error) {
    console.error('Analysis history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/ai/analysis/:analysisId
 * Delete an AI analysis result
 */
router.delete('/analysis/:analysisId', authenticateToken, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user.id;

    // Verify ownership before deleting
    const verifyQuery = `
      SELECT aar.id 
      FROM ai_analysis_results aar
      JOIN family_members fm ON aar.family_member_id = fm.id
      WHERE aar.id = ? AND fm.user_id = ?
    `;

    db.get(verifyQuery, [analysisId, userId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!result) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }

      // Delete the analysis
      const deleteQuery = `DELETE FROM ai_analysis_results WHERE id = ?`;
      
      db.run(deleteQuery, [analysisId], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting analysis:', deleteErr);
          return res.status(500).json({ error: 'Error deleting analysis' });
        }

        res.json({ 
          success: true, 
          message: 'Analysis deleted successfully' 
        });
      });
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;