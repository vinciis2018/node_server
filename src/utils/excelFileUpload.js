import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow Excel files with more permissive checking
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/octet-stream' // Some Excel files might come with this MIME type
  ];

  // Get file extension
  const extname = path.extname(file.originalname).toLowerCase();
  
  // Log file info for debugging
  console.log('Uploading file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension: extname
  });

  // Check extension and MIME type
  const isExtensionValid = allowedExtensions.includes(extname);
  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);

  if (isExtensionValid && isMimeTypeValid) {
    return cb(null, true);
  } else {
    console.error('File rejected:', {
      reason: 'Invalid file type',
      allowedExtensions,
      allowedMimeTypes,
      received: {
        name: file.originalname,
        mimetype: file.mimetype,
        extension: extname
      }
    });
    cb(new Error(`Only Excel files are allowed! Received: ${file.mimetype} (${extname})`), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files per upload
  }
});

// Middleware to handle file uploads with additional fields
const handleExcelUpload = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    // Configure multer to handle multiple files with the same field name
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, function(err) {
      if (err) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new Error(`Unexpected field: ${err.field}. Please use '${fieldName}' as the field name.`));
        }
        return next(err);
      }
      
      // Log the uploaded files for debugging
      if (req.files) {
        console.log(`Successfully processed ${req.files.length} files`);
      }
      
      next();
    });
  };
};

// Pre-configured middlewares
export const uploadExcelFiles = handleExcelUpload('files', 10);

export { upload, handleExcelUpload };
