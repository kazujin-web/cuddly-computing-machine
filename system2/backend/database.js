import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verboseSqlite3 = sqlite3.verbose();
const DBSOURCE = path.join(__dirname, "system2.sqlite");

export const db = new verboseSqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the System 2 SQLite database.');
    }
});

export const initDatabase = () => {
    db.serialize(() => {
        console.log('Initializing System 2 database tables...');
        
        // Users table (simplified for system 2 but extensible)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            studentId TEXT,
            lrn TEXT,
            gradeLevel TEXT,
            section TEXT,
            avatar TEXT
        )`);

        // Cache for academic records from Google Sheets
        db.run(`CREATE TABLE IF NOT EXISTS academic_records (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            lrn TEXT,
            subject TEXT,
            q1 REAL,
            q2 REAL,
            q3 REAL,
            q4 REAL,
            finalGrade REAL,
            remarks TEXT,
            lastUpdated TEXT
        )`);

        // Configuration for Google Sheets integration
        db.run(`CREATE TABLE IF NOT EXISTS sheet_configs (
            id TEXT PRIMARY KEY,
            configKey TEXT UNIQUE,
            configValue TEXT
        )`);

        // Student ID metadata
        db.run(`CREATE TABLE IF NOT EXISTS student_id_metadata (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            qrCodeData TEXT,
            issueDate TEXT,
            expiryDate TEXT
        )`);

        console.log('System 2 database tables initialized.');
    });
};
