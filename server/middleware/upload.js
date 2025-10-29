import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists (support overriding via env for Render persistent disk)
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images, PDFs, and Word documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files, PDFs, and Word documents are allowed!'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
    files: 20 // Maximum 20 files per request
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

// Process and save uploaded documents (PDFs and Word files)
export const processDocuments = async (files, activityType, studentId) => {
  if (!files || files.length === 0) {
    return [];
  }

  const processedDocuments = [];
  const timestamp = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const filename = `${activityType}_${studentId}_${timestamp}_${i}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    try {
      // Save document as-is (no processing needed for PDFs/Word)
      fs.writeFileSync(filepath, file.buffer);

      // Store relative path for database
      const relativePath = `/uploads/${filename}`;
      processedDocuments.push({
        path: relativePath,
        originalName: originalName,
        type: file.mimetype,
        size: file.size
      });
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document ${i + 1}: ${error.message}`);
    }
  }

  return processedDocuments;
};

// Process mixed files (images and documents)
export const processMixedFiles = async (files, activityType, studentId) => {
  if (!files || files.length === 0) {
    return { images: [], documents: [] };
  }

  const images = [];
  const documents = [];
  const timestamp = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const filename = `${activityType}_${studentId}_${timestamp}_${i}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    try {
      if (file.mimetype.startsWith('image/')) {
        // Process image with sharp
        await sharp(file.buffer)
          .resize(800, 600, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .webp({ quality: 80 })
          .toFile(filepath);

        images.push(`/uploads/${filename}`);
      } else {
        // Save document as-is
        fs.writeFileSync(filepath, file.buffer);
        documents.push({
          path: `/uploads/${filename}`,
          originalName: originalName,
          type: file.mimetype,
          size: file.size
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Failed to process file ${i + 1}: ${error.message}`);
    }
  }

  return { images, documents };
};

// Single file upload middleware
export const uploadSingle = upload.single('photo');

// Multiple files upload middleware
export const uploadMultiple = upload.array('photos', 20);

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 20 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (error.message === 'Only image files, PDFs, and Word documents are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files, PDFs, and Word documents are allowed!'
    });
  }

  next(error);
};

export default upload;
