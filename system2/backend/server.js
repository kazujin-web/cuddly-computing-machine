import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import { db, initDatabase } from './database.js';
import { google } from 'googleapis';
import xlsx from 'xlsx';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadDir, 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Initialize Database
initDatabase();

// Seed database on startup if empty
db.get('SELECT count(*) as count FROM users', (err, row) => {
  if (row && row.count === 0) {
    console.log('Seeding initial data...');
    db.serialize(() => {
      // Admin/Teacher
      db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role) 
        VALUES ('admin1', 'Administrator', 'admin@snps.edu.ph', 'admin123', 'admin')`);
      db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role) 
        VALUES ('teacher1', 'Maria Santos', 'maria.santos@snps.edu.ph', 'teacher123', 'teacher')`);
      
      // Students
      db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role, studentId, lrn, gradeLevel, section) 
        VALUES ('stu1', 'Juan Dela Cruz', 'juan.dc@snps.edu.ph', 'student123', 'student', '2025-0001', '123456789012', 'Grade 5', 'St. Joseph')`);
      db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role, studentId, lrn, gradeLevel, section) 
        VALUES ('stu2', 'Elena Reyes', 'elena.reyes@snps.edu.ph', 'student123', 'student', '2025-0002', '123456789013', 'Grade 5', 'St. Joseph')`);
    });
  }
});

// Google Sheets Auth Setup (Placeholder for real credentials)
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'), // User needs to provide this
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const getSheetsService = async () => {
  try {
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
  } catch (error) {
    console.error('Google Sheets Auth Error:', error.message);
    return null;
  }
};

// --- Routes ---

// GET: Read all workbook data (from local XLSX or GSheet)
app.get('/api/workbook', async (req, res) => {
  const { source } = req.query; // 'local' or 'gsheet'
  const templatePath = path.resolve(__dirname, '..', 'Public', 'SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1).xlsx');
  
  if (source === 'gsheet') {
    const sheets = await getSheetsService();
    if (!sheets) return res.status(503).json({ error: 'GSheet service unavailable' });
    
    try {
      const spreadsheetId = '1ynlb3Qc7IarBP9bHDwSmHCdd4zFwuHPRE_Y4ujDeY0M';
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const result = {};
      const sheetNames = meta.data.sheets.map(s => s.properties.title);

      for (const name of sheetNames) {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: name,
        });
        result[name] = response.data.values || [[]];
      }
      return res.json({ sheets: result, sheetNames });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Default: Local XLSX
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({ error: 'Workbook file not found' });
  }

  try {
    const workbook = xlsx.readFile(templatePath, { cellStyles: true });
    const result = {};
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      result[sheetName] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    });
    res.json({ sheets: result, sheetNames: workbook.SheetNames });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Sync Local XLSX to Google Sheets
app.post('/api/sync-to-gsheet', async (req, res) => {
  const templatePath = path.resolve(__dirname, '..', 'Public', 'SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1).xlsx');
  const sheets = await getSheetsService();
  if (!sheets) return res.status(503).json({ error: 'GSheet service unavailable' });

  try {
    const spreadsheetId = '1ynlb3Qc7IarBP9bHDwSmHCdd4zFwuHPRE_Y4ujDeY0M';
    const workbook = xlsx.readFile(templatePath);
    
    for (const name of workbook.SheetNames) {
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: name,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: data },
      });
    }
    res.json({ message: 'All sheets synced to Google Sheets successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Formatted Excel (Using Template)
app.get('/api/download-excel', (req, res) => {
  const templatePath = path.resolve(__dirname, '..', 'Public', 'SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1).xlsx');
  
  if (!fs.existsSync(templatePath)) {
    console.error('Template not found at:', templatePath);
    return res.status(404).json({ error: 'Template Excel file not found' });
  }

  db.all('SELECT * FROM users WHERE role = "student"', (err, students) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const workbook = xlsx.readFile(templatePath);
      const sheetName = 'Class Info';
      const worksheet = workbook.Sheets[sheetName];

      if (worksheet) {
        // Prepare data rows starting from row 2 (A2)
        const dataRows = students.map(s => [
          s.name,
          s.lrn,
          s.id === 'stu2' ? 'FEMALE' : 'MALE',
          11 // Age mock
        ]);

        // Add to worksheet
        xlsx.utils.sheet_add_aoa(worksheet, dataRows, { origin: 'A2' });
      }

      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="SF9_Report_Card_2025-2026.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'System 2 Backend is running' });
});

// User Authentication (Mock)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ user });
  });
});

// Fetch SF9 Data
app.get('/api/sf9/:studentId', async (req, res) => {
  const { studentId } = req.params;
  
  // Try to get from SQLite cache first
  db.all('SELECT * FROM academic_records WHERE studentId = ?', [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT * FROM users WHERE studentId = ?', [studentId], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'Student not found' });

      if (rows.length === 0) {
        // Fallback to mock data if no records in DB
        const mockSf9 = {
          student: {
            lrn: user.lrn,
            name: user.name,
            gradeLevel: user.gradeLevel,
            section: user.section,
            gender: user.id === 'stu2' ? 'FEMALE' : 'MALE',
            age: 11
          },
          schoolYear: '2025-2026',
          grades: [
            { subject: 'Filipino', q1: 88, q2: 89, q3: 90, q4: 91, final: 90, remarks: 'Passed' },
            { subject: 'English', q1: 85, q2: 86, q3: 87, q4: 88, final: 87, remarks: 'Passed' },
            { subject: 'Mathematics', q1: 82, q2: 84, q3: 85, q4: 86, final: 84, remarks: 'Passed' },
            { subject: 'Science', q1: 89, q2: 90, q3: 91, q4: 92, final: 91, remarks: 'Passed' },
            { subject: 'Araling Panlipunan', q1: 91, q2: 92, q3: 93, q4: 94, final: 93, remarks: 'Passed' },
            { subject: 'MAPEH', q1: 90, q2: 91, q3: 92, q4: 93, final: 92, remarks: 'Passed' },
            { subject: 'EPP/TLE', q1: 87, q2: 88, q3: 89, q4: 90, final: 89, remarks: 'Passed' },
            { subject: 'EsP', q1: 94, q2: 95, q3: 96, q4: 97, final: 96, remarks: 'Passed' },
          ],
          attendance: [
            { month: 'June', schoolDays: 20, daysPresent: 20, daysAbsent: 0 },
            { month: 'July', schoolDays: 22, daysPresent: 21, daysAbsent: 1 },
            { month: 'August', schoolDays: 21, daysPresent: 21, daysAbsent: 0 },
            { month: 'September', schoolDays: 20, daysPresent: 19, daysAbsent: 1 },
          ],
          values: [
            { value: 'Maka-Diyos', behaviorStatements: ['Expresses spiritual beliefs'], q1: 'AO', q2: 'AO', q3: 'AO', q4: 'AO' },
            { value: 'Maka-Tao', behaviorStatements: ['Sensitive to differences'], q1: 'AO', q2: 'AO', q3: 'AO', q4: 'AO' },
          ]
        };
        return res.json(mockSf9);
      }
      
      // If we have rows, format them to match SF9Data interface
      const sf9Data = {
        student: {
          lrn: user.lrn,
          name: user.name,
          gradeLevel: user.gradeLevel,
          section: user.section,
          gender: user.id === 'stu2' ? 'FEMALE' : 'MALE',
          age: 11
        },
        schoolYear: '2025-2026',
        grades: rows.map(r => ({
          subject: r.subject,
          q1: r.q1,
          q2: r.q2,
          q3: r.q3,
          q4: r.q4,
          final: r.finalGrade,
          remarks: r.remarks
        })),
        attendance: [
           { month: 'June', schoolDays: 20, daysPresent: 20, daysAbsent: 0 },
        ],
        values: []
      };
      res.json(sf9Data);
    });
  });
});

// Fetch Class Record
app.get('/api/class-record', (req, res) => {
  db.all('SELECT * FROM users WHERE role = "student"', (err, students) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // In a real app, we'd join with academic_records
    // For demo, we'll return the list of students formatted for the GradingSheet
    const formattedStudents = students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      sex: s.id === 'stu2' ? 'F' : 'M', // Mock sex since not in simplified users table
      lrn: s.lrn,
      age: 10,
      subjects: {
        ESP: { q1: 85, q2: 86, q3: 84, q4: 85, final: 85 },
        ENGLISH: { q1: 81, q2: 82, q3: 81, q4: 82, final: 81.5 },
        MATH: { q1: 81, q2: 81, q3: 82, q4: 81, final: 81.25 },
        SCIENCE: { q1: 80, q2: 81, q3: 80, q4: 81, final: 80.5 },
        FILIPINO: { q1: 81, q2: 81, q3: 80, q4: 81, final: 80.75 },
        AP: { q1: 87, q2: 84, q3: 82, q4: 84, final: 84.25 },
        EPP: { q1: 90, q2: 88, q3: 85, q4: 88, final: 87.75 },
        MAPEH: { q1: 86, q2: 84, q3: 85, q4: 86, final: 85.25 }
      }
    }));

    res.json({
      section: 'St. Joseph',
      gradeLevel: 'Grade 5',
      schoolYear: '2025-2026',
      students: formattedStudents
    });
  });
});

// Student ID Generator Data
app.get('/api/student-id/:studentId', (req, res) => {
  const { studentId } = req.params;
  db.get('SELECT * FROM users WHERE studentId = ?', [studentId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Student not found' });
    
    res.json({
      name: user.name,
      studentId: user.studentId,
      lrn: user.lrn,
      gradeLevel: user.gradeLevel,
      section: user.section,
      photoUrl: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      gender: user.id === 'stu2' ? 'FEMALE' : 'MALE',
      age: 11,
      schoolYear: '2025-2026'
    });
  });
});

// Synchronize with Google Sheets (Teacher Role)
app.post('/api/sync-grades', async (req, res) => {
  const { spreadsheetId, range, data } = req.body;
  const sheets = await getSheetsService();
  
  if (!sheets) {
    return res.status(503).json({ 
      error: 'Google Sheets service unavailable', 
      message: 'Check credentials.json or use local Excel upload.' 
    });
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: data },
    });
    res.json({ message: 'Synced successfully with Google Sheets' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excel Template Upload & Processing
app.post('/api/upload-grades', upload.single('excel'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // Process and save to DB
    const stmt = db.prepare(`INSERT OR REPLACE INTO academic_records 
      (id, studentId, lrn, subject, q1, q2, q3, q4, finalGrade, remarks, lastUpdated) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    sheetData.forEach(row => {
      const id = `${row.studentId}-${row.subject}`;
      stmt.run(id, row.studentId, row.lrn, row.subject, row.q1, row.q2, row.q3, row.q4, row.finalGrade, row.remarks, new Date().toISOString());
    });
    stmt.finalize();

    res.json({ message: 'Grades uploaded and processed successfully', count: sheetData.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed Data Endpoint
app.post('/api/seed', (req, res) => {
  db.serialize(() => {
    // Admin/Teacher
    db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role) 
      VALUES ('admin1', 'Administrator', 'admin@snps.edu.ph', 'admin123', 'admin')`);
    db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role) 
      VALUES ('teacher1', 'Maria Santos', 'maria.santos@snps.edu.ph', 'teacher123', 'teacher')`);
    
    // Students
    db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role, studentId, lrn, gradeLevel, section) 
      VALUES ('stu1', 'Juan Dela Cruz', 'juan.dc@snps.edu.ph', 'student123', 'student', '2025-0001', '123456789012', 'Grade 5', 'St. Joseph')`);
    db.run(`INSERT OR REPLACE INTO users (id, name, email, password, role, studentId, lrn, gradeLevel, section) 
      VALUES ('stu2', 'Elena Reyes', 'elena.reyes@snps.edu.ph', 'student123', 'student', '2025-0002', '123456789013', 'Grade 5', 'St. Joseph')`);
  });
  res.json({ message: 'Database seeded successfully' });
});

// Fetch Masterlist
app.get('/api/masterlist', (req, res) => {
  db.all('SELECT * FROM users WHERE role = "student"', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
