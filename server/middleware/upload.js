import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Process and save uploaded images
export const processImages = async (files, activityType, studentId) => {
  if (!files || files.length === 0) {
    return [];
  }

  const processedImages = [];
  const timestamp = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = `${activityType}_${studentId}_${timestamp}_${i}.webp`;
    const filepath = path.join(uploadsDir, filename);

    try {
      // Process image with sharp
      await sharp(file.buffer)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 80 })
        .toFile(filepath);

      // Store relative path for database
      const relativePath = `/uploads/${filename}`;
      processedImages.push(relativePath);
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Failed to process image ${i + 1}: ${error.message}`);
    }
  }

  return processedImages;
};

// Single file upload middleware
export const uploadSingle = upload.single('photo');

// Multiple files upload middleware
export const uploadMultiple = upload.array('photos', 10);

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }

  next(error);
};

export default upload;
