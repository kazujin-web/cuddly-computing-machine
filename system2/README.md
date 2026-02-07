# 🎓 Sto. Niño Portal - System 2 (Epic Edition)

Welcome to the automated, Excel-driven evolution of the Sto. Niño School Portal. This system provides a professional, high-fidelity experience for managing academic records and generating official SF9 report cards.

## 🚀 Key Features

### 📝 1. Epic Grading System (Google Sheets Clone)
- **Live Excel Editing**: Edit grades directly in a web-based spreadsheet interface.
- **Universal Sheets**: Access every sheet from the master workbook (QUARTER 1-4, Class Info, etc.).
- **Formula Bar**: Professional UI with cell referencing (e.g., A1, B5) and data focus.
- **Dual Source**: Toggle instantly between **Local** (server-side .xlsx) and **GSheet** (Cloud) data.
- **Cloud Sync**: Push your local updates to Google Sheets with a single click.

### 📄 2. Professional SF9 Viewer
- **Print-Perfect**: A high-fidelity digital preview that mimics the official DepEd SF9 document.
- **Official Branding**: Integrated school logos and government standard formatting.
- **Auto-Styling**: Detects student gender, highlights failing grades in red, and formats section headers dynamically.
- **PDF Controls**: Zoom, print, and save controls within a professional document viewer.

### 🆔 3. Dynamic Student ID
- **QR Enabled**: Generates student IDs with dynamic QR codes for digital verification.
- **Real-time Data**: Syncs profile photo, LRN, and academic details directly from the master records.

---

## 🛠️ Setup Instructions

### 1. Installation
```bash
# Install Frontend Dependencies
cd system2
npm install

# Install Backend Dependencies
cd backend
npm install
```

### 2. Google Sheets Integration (Optional)
To enable Cloud Sync:
1. Obtain a `credentials.json` from your Google Cloud Console (Service Account).
2. Place it in `system2/backend/`.
3. Open `system2/backend/server.js` and update `spreadsheetId` with your Google Sheet ID.

### 3. Running the System
Execute the master script to launch both servers:
```bash
./run-system2.sh
```
- **Frontend**: http://localhost:3001 (or your Codespace URL)
- **Backend**: http://localhost:5001

---

## 👤 Role Access (Demo)

Use the **"Switch Role"** button in the sidebar to test:
- **Teacher (Maria Santos)**: Full access to the Spreadsheet Grading System and Masterlist.
- **Student (Juan Dela Cruz)**: Access to the Professional SF9 Viewer and Digital ID.

---

## 📁 System Architecture
- **Core Database**: `system2/Public/SF 9 REPORT CARD AUTOMATED...xlsx` (The single source of truth).
- **Backend**: Node.js/Express with `xlsx` engine for live file manipulation.
- **Frontend**: React 19 + Tailwind CSS for the "Epic" Google Sheets UI.

**Note**: All HTML exports and legacy mock files have been removed. The system now runs natively on the Excel workbook.