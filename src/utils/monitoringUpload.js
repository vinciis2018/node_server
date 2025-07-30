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
    // Create monitoring uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../public/monitoring');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `monitoring-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow common media files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi'];
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];

  // Get file extension
  const extname = path.extname(file.originalname).toLowerCase();
  
  // Check extension and MIME type
  const isExtensionValid = allowedExtensions.includes(extname);
  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);

  if (isExtensionValid && isMimeTypeValid) {
    return cb(null, true);
  } else {
    console.error('Invalid file type:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: extname
    });
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 10 // Maximum 10 files per upload
  }
});

// Middleware to handle monitoring media uploads
export const uploadMonitoringMedia = (req, res, next) => {
  const uploadHandler = upload.array('media', 10); // 'media' is the field name
  
  uploadHandler(req, res, function(err) {
    if (err) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new Error(`Unexpected field: ${err.field}. Please use 'media' as the field name.`));
      }
      return next(err);
    }
    
    // Log the uploaded files for debugging
    if (req.files) {
      console.log(`Successfully processed ${req.files.length} monitoring media files`);
    }
    
    next();
  });
};

export default upload;
