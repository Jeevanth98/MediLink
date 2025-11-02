import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Get all reminders for the authenticated user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT r.*, fm.name as family_member_name
    FROM reminders r
    LEFT JOIN family_members fm ON r.family_member_id = fm.id
    WHERE r.user_id = ?
    ORDER BY r.reminder_time ASC
  `;
  
  db.all(query, [userId], (err, reminders) => {
    if (err) {
      console.error('Error fetching reminders:', err);
      return res.status(500).json({ error: 'Failed to fetch reminders' });
    }
    
    // Parse reminder_days JSON for each reminder
    const parsedReminders = reminders.map(reminder => ({
      ...reminder,
      reminder_days: JSON.parse(reminder.reminder_days)
    }));
    
    res.json({ reminders: parsedReminders });
  });
});

// Get active reminders that need to be triggered
router.get('/active', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  
  const query = `
    SELECT r.*, fm.name as family_member_name
    FROM reminders r
    LEFT JOIN family_members fm ON r.family_member_id = fm.id
    WHERE r.user_id = ?
    AND r.is_active = 1
    AND r.start_date <= ?
    AND (r.end_date IS NULL OR r.end_date >= ?)
  `;
  
  db.all(query, [userId, currentDate, currentDate], (err, reminders) => {
    if (err) {
      console.error('Error fetching active reminders:', err);
      return res.status(500).json({ error: 'Failed to fetch active reminders' });
    }
    
    const parsedReminders = reminders.map(reminder => ({
      ...reminder,
      reminder_days: JSON.parse(reminder.reminder_days)
    }));
    
    res.json({ reminders: parsedReminders });
  });
});

// Create a new reminder
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const {
    family_member_id,
    reminder_type,
    title,
    description,
    reminder_time,
    reminder_days,
    start_date,
    end_date
  } = req.body;
  
  // Validate required fields
  if (!reminder_type || !title || !reminder_time || !reminder_days || !start_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = `
    INSERT INTO reminders (
      user_id, family_member_id, reminder_type, title, description,
      reminder_time, reminder_days, start_date, end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(
    query,
    [
      userId,
      family_member_id || null,
      reminder_type,
      title,
      description || '',
      reminder_time,
      JSON.stringify(reminder_days),
      start_date,
      end_date || null
    ],
    function(err) {
      if (err) {
        console.error('Error creating reminder:', err);
        return res.status(500).json({ error: 'Failed to create reminder' });
      }
      
      res.status(201).json({
        message: 'Reminder created successfully',
        reminderId: this.lastID
      });
    }
  );
});

// Update a reminder
router.put('/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const reminderId = req.params.id;
  const {
    family_member_id,
    reminder_type,
    title,
    description,
    reminder_time,
    reminder_days,
    start_date,
    end_date,
    is_active
  } = req.body;
  
  // First check if the reminder belongs to the user
  db.get(
    'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
    [reminderId, userId],
    (err, reminder) => {
      if (err) {
        console.error('Error checking reminder ownership:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      
      const query = `
        UPDATE reminders
        SET family_member_id = ?,
            reminder_type = ?,
            title = ?,
            description = ?,
            reminder_time = ?,
            reminder_days = ?,
            start_date = ?,
            end_date = ?,
            is_active = ?,
            updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `;
      
      db.run(
        query,
        [
          family_member_id || null,
          reminder_type,
          title,
          description || '',
          reminder_time,
          JSON.stringify(reminder_days),
          start_date,
          end_date || null,
          is_active !== undefined ? is_active : 1,
          reminderId,
          userId
        ],
        (err) => {
          if (err) {
            console.error('Error updating reminder:', err);
            return res.status(500).json({ error: 'Failed to update reminder' });
          }
          
          res.json({ message: 'Reminder updated successfully' });
        }
      );
    }
  );
});

// Toggle reminder active status
router.patch('/:id/toggle', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const reminderId = req.params.id;
  
  const query = `
    UPDATE reminders
    SET is_active = NOT is_active,
        updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [reminderId, userId], function(err) {
    if (err) {
      console.error('Error toggling reminder:', err);
      return res.status(500).json({ error: 'Failed to toggle reminder' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder status updated successfully' });
  });
});

// Delete a reminder
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const reminderId = req.params.id;
  
  const query = 'DELETE FROM reminders WHERE id = ? AND user_id = ?';
  
  db.run(query, [reminderId, userId], function(err) {
    if (err) {
      console.error('Error deleting reminder:', err);
      return res.status(500).json({ error: 'Failed to delete reminder' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  });
});

// Update last triggered time
router.patch('/:id/triggered', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const reminderId = req.params.id;
  
  const query = `
    UPDATE reminders
    SET last_triggered = datetime('now')
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [reminderId, userId], function(err) {
    if (err) {
      console.error('Error updating last triggered:', err);
      return res.status(500).json({ error: 'Failed to update reminder' });
    }
    
    res.json({ message: 'Reminder triggered timestamp updated' });
  });
});

export default router;
