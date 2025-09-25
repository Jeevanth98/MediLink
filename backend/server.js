import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import familyMembersRoutes from './routes/familyMembers.js';
import medicalRecordsRoutes from './routes/medicalRecords.js';
import filesRoutes from './routes/files.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Support multiple ports
  credentials: true
}));
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/family-members', familyMembersRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/files', filesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
