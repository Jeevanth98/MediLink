import express from 'express';
import { db } from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Predefined relationship options
const RELATIONSHIP_OPTIONS = [
  'Self',
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Grandparent',
  'Grandchild',
  'Uncle',
  'Aunt',
  'Cousin',
  'In-Law',
  'Other'
];

// Blood group options
const BLOOD_GROUP_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

// Get relationship options
router.get('/relationship-options', (req, res) => {
  res.json({ relationships: RELATIONSHIP_OPTIONS });
});

// Get blood group options
router.get('/blood-group-options', (req, res) => {
  res.json({ bloodGroups: BLOOD_GROUP_OPTIONS });
});

// Get all family members for a user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT * FROM family_members 
    WHERE user_id = ? AND is_active = true 
    ORDER BY created_at DESC
  `;
  
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching family members:', err);
      return res.status(500).json({ error: 'Failed to fetch family members' });
    }
    
    res.json({ 
      message: 'Family members fetched successfully',
      familyMembers: rows 
    });
  });
});

// Get a specific family member
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const query = `
    SELECT * FROM family_members 
    WHERE id = ? AND user_id = ? AND is_active = true
  `;
  
  db.get(query, [id, userId], (err, row) => {
    if (err) {
      console.error('Error fetching family member:', err);
      return res.status(500).json({ error: 'Failed to fetch family member' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    
    res.json({ 
      message: 'Family member fetched successfully',
      familyMember: row 
    });
  });
});

// Create a new family member
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    gender,
    age,
    blood_group,
    relationship,
    phone,
    emergency_contact,
    height,
    weight
  } = req.body;

  // Validate required fields
  if (!name || !age || !blood_group || !relationship || !emergency_contact) {
    return res.status(400).json({ 
      error: 'Required fields: name, age, blood_group, relationship, emergency_contact' 
    });
  }

  // Validate relationship option
  if (!RELATIONSHIP_OPTIONS.includes(relationship)) {
    return res.status(400).json({ 
      error: 'Invalid relationship option' 
    });
  }

  // Validate blood group
  if (!BLOOD_GROUP_OPTIONS.includes(blood_group)) {
    return res.status(400).json({ 
      error: 'Invalid blood group' 
    });
  }

  const query = `
    INSERT INTO family_members (
      user_id, name, gender, age, blood_group, relationship, 
      phone, emergency_contact, height, weight
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    userId, name, gender, age, blood_group, relationship,
    phone, emergency_contact, height, weight
  ], function(err) {
    if (err) {
      console.error('Error creating family member:', err);
      return res.status(500).json({ error: 'Failed to create family member' });
    }

    // Fetch the created family member
    const selectQuery = 'SELECT * FROM family_members WHERE id = ?';
    db.get(selectQuery, [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created family member:', err);
        return res.status(500).json({ error: 'Family member created but failed to fetch details' });
      }

      res.status(201).json({
        message: 'Family member created successfully',
        familyMember: row
      });
    });
  });
});

// Update a family member
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const {
    name,
    gender,
    age,
    blood_group,
    relationship,
    phone,
    emergency_contact,
    height,
    weight
  } = req.body;

  // Validate required fields
  if (!name || !age || !blood_group || !relationship || !emergency_contact) {
    return res.status(400).json({ 
      error: 'Required fields: name, age, blood_group, relationship, emergency_contact' 
    });
  }

  const query = `
    UPDATE family_members 
    SET name = ?, gender = ?, age = ?, blood_group = ?, relationship = ?, 
        phone = ?, emergency_contact = ?, height = ?, weight = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND is_active = true
  `;

  db.run(query, [
    name, gender, age, blood_group, relationship,
    phone, emergency_contact, height, weight, id, userId
  ], function(err) {
    if (err) {
      console.error('Error updating family member:', err);
      return res.status(500).json({ error: 'Failed to update family member' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    // Fetch the updated family member
    const selectQuery = 'SELECT * FROM family_members WHERE id = ? AND user_id = ?';
    db.get(selectQuery, [id, userId], (err, row) => {
      if (err) {
        console.error('Error fetching updated family member:', err);
        return res.status(500).json({ error: 'Family member updated but failed to fetch details' });
      }

      res.json({
        message: 'Family member updated successfully',
        familyMember: row
      });
    });
  });
});

// Delete (soft delete) a family member
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const query = `
    UPDATE family_members 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND is_active = true
  `;

  db.run(query, [id, userId], function(err) {
    if (err) {
      console.error('Error deleting family member:', err);
      return res.status(500).json({ error: 'Failed to delete family member' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    res.json({ message: 'Family member deleted successfully' });
  });
});

export default router;