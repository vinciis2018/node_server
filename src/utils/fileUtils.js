import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads an Excel file from a local URL and parses all its sheets
 * @param {string} fileUrl - The local URL of the Excel file (e.g., '/uploads/filename.xlsx')
 * @returns {Promise<Object>} - Parsed Excel data with all sheets, headers and rows
 */
export const readExcelFromLocalUrl = async (fileUrl) => {
  try {
    // Convert URL to filesystem path
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    
    // Read file buffer
    const fileBuffer = await fs.readFile(filePath);
    
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

    // Process all sheets
    const allSheets = [];
    let totalRowCount = 0;

    for (let sheetNumber = 0; sheetNumber < workbook.SheetNames.length; sheetNumber++) {
      const sheetName = workbook.SheetNames[sheetNumber];
      const sheetData = workbook.Sheets[sheetName];
      
      // Convert sheet to array of arrays
      const sheet = XLSX.utils.sheet_to_json(sheetData, { 
        header: 1, 
        defval: null,
        raw: false 
      });

      // Skip empty sheets
      if (sheet.length === 0) continue;

      const sheetHeaders = sheet[0]?.map(header => String(header ?? '')) || [];
      const sheetRows = sheet.length > 1 ? sheet.slice(1) : [];
      
      // Calculate stats for this sheet
      const rowCount = sheetRows.length;
      const columnCount = sheetHeaders.length;
      const rows = rowCount > 0 ? sheetRows : [];
      const firstRow = rowCount > 0 ? sheetRows[0] : null;
      const lastRow = rowCount > 0 ? sheetRows[rowCount - 1] : null;

      allSheets.push({
        sheetName,
        data: {
          headers: sheetHeaders,
          rows: sheetRows
        },
        stats: {
          rowCount,
          columnCount,
          columnNames: [...sheetHeaders],
          firstRow,
          lastRow,
          rows,
        }
      });

      totalRowCount += rowCount;
    }

    if (allSheets.length === 0) {
      return { 
        data: { 
          headers: [], 
          rows: [] 
        }, 
        stats: { 
          rowCount: 0, 
          columnCount: 0, 
          columnNames: [], 
          firstRow: null, 
          lastRow: null,
          rows: []
        },
        data: []
      };
    }

    // Get overall stats (using first sheet as reference)
    const firstSheet = allSheets[0];
    const overallStats = {
      rowCount: totalRowCount,
      columnCount: firstSheet.stats.columnCount, // Using first sheet's column count as reference
      columnNames: firstSheet.stats.columnNames,
      firstRow: firstSheet.stats.firstRow,
      lastRow: allSheets[allSheets.length - 1].stats.lastRow,
      sheetCount: allSheets.length,
    };

    return { 
      data: allSheets, // For backward compatibility
      stats: overallStats,
      sheets: allSheets,
      fileName: path.basename(fileUrl)
    };
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return { 
      error: error instanceof Error ? 
        `Error parsing Excel file: ${error.message}` : 
        'An unknown error occurred while parsing the Excel file.' 
    };
  }
};

/**
 * Gets file stats and metadata
 * @param {string} fileUrl - The local URL of the file
 * @returns {Promise<Object>} - File stats and metadata
 */
export const getFileStats = async (fileUrl) => {
  try {
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    const stats = await fs.stat(filePath);
    
    return {
      exists: true,
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
      path: fileUrl
    };
  }
};
