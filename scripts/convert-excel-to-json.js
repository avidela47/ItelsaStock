const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_FILE = path.resolve(__dirname, '..', 'ItelsaStockDB.xlsx');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'data', 'stock-data.json');

function ensureOutputDir() {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function convertExcelToJson() {
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`No se encontró el archivo ${EXCEL_FILE}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_FILE);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
  });

  const rows = rawRows.map((row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      const cleanKey = typeof key === 'string' ? key.trim() : key;
      normalized[cleanKey] = value;
    });
    return normalized;
  });

  const payload = {
    updatedAt: new Date().toISOString(),
    total: rows.length,
    rows,
  };

  ensureOutputDir();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Archivo JSON generado en ${OUTPUT_FILE}`);
}

convertExcelToJson();
