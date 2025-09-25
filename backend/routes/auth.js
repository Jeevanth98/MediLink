import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, age } = req.body;
    
    console.log('Signup attempt with data:', { name, email, phone, age }); // Debug log

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Please provide name, email, and password' 
      });
    }

    // Additional field validation
    if (!phone || !age) {
      return res.status(400).json({ 
        error: 'Please provide all required fields: phone and age' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log('Password hashed successfully'); // Debug log

      // Insert new user
      const insertQuery = `
        INSERT INTO users (name, email, password, phone, age) 
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(insertQuery, [name, email, hashedPassword, phone, age], function(err) {
        if (err) {
          console.error('Database insertion error:', err); // Debug log
          return res.status(500).json({ error: 'Failed to create user' });
        }

        console.log('User created successfully with ID:', this.lastID); // Debug log

        // Generate JWT token
        const token = jwt.sign(
          { userId: this.lastID, email }, 
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'User created successfully',
          user: {
            id: this.lastID,
            name,
            email,
            phone,
            age
          },
          token
        });
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password ? password.length : 'undefined');

    // Validation
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        error: 'Please provide email and password' 
      });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error during user lookup:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      console.log('User found in database:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Password hash exists:', !!user.password);
      console.log('- Password hash length:', user.password ? user.password.length : 'undefined');

      // Check password
      try {
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', isValidPassword);
        
        if (!isValidPassword) {
          console.log('Password comparison failed - invalid password');
          return res.status(401).json({ 
            error: 'Invalid email or password' 
          });
        }

        console.log('Password comparison successful - generating token');
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email }, 
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        console.log('Login successful for user:', user.email);
        console.log('=== LOGIN SUCCESS ===');

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            age: user.age
          },
          token
        });
      } catch (bcryptError) {
        console.error('Bcrypt comparison error:', bcryptError);
        return res.status(500).json({ error: 'Password verification failed' });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, phone, age, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  });
});

// Update Profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, email, phone, age } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Please provide name and email' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Check if email is already taken by another user
    db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, req.user.userId], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email is already taken by another user' 
        });
      }

      // Update user
      const updateQuery = `
        UPDATE users 
        SET name = ?, email = ?, phone = ?, age = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      db.run(updateQuery, [name, email, phone, age, req.user.userId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json({
          message: 'Profile updated successfully',
          user: {
            id: req.user.userId,
            name,
            email,
            phone,
            age
          }
        });
      });
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
