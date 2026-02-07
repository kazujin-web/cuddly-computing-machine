const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

const SAMPLE_EXCEL_PATH = path.join(__dirname, '../../samples/SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1)(1).xlsx');

// Endpoint to generate and download the full Excel file
app.post('/api/generate-excel', async (req, res) => {
  const { userData, role } = req.body;
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(SAMPLE_EXCEL_PATH);
    
    // 1. Fill Student Data in "K-12 Front"
    const frontSheet = workbook.getWorksheet('K-12 Front');
    if (userData && frontSheet) {
      // Mapping based on find_cells.js
      if (userData.name) frontSheet.getCell('Q12').value = userData.name;
      if (userData.age) frontSheet.getCell('Q13').value = userData.age;
      if (userData.sex) frontSheet.getCell('U13').value = userData.sex;
      if (userData.lrn) frontSheet.getCell('X13').value = userData.lrn;
      if (userData.grade) frontSheet.getCell('R14').value = userData.grade;
      if (userData.section) frontSheet.getCell('V14').value = userData.section;
    }

    // 2. Role-based sheet removal
    if (role === 'student') {
      const sheetsToKeep = ['K-12 Front', 'Grade 5 Inside'];
      // We must iterate backwards when removing by index, or use names
      workbook.worksheets.forEach(sheet => {
        if (!sheetsToKeep.includes(sheet.name)) {
          workbook.removeWorksheet(sheet.id);
        }
      });
    }

    // 3. Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // 4. Send File
    const fileName = `SF9_${userData?.name?.replace(/\s+/g, '_') || 'Report'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
    
  } catch (err) {
    console.error("Error generating Excel:", err);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

app.listen(PORT, () => {
  console.log(`System2 Local-Ready Backend running on port ${PORT}`);
});