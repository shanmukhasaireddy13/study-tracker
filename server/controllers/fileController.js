import { processImages } from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload photos for study entry
export const uploadPhotos = async (req, res) => {
  try {
    const { activityType } = req.body;
    const studentId = req.user.id;

    if (!activityType) {
      return res.status(400).json({
        success: false,
        message: 'Activity type is required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process and save images
    const imagePaths = await processImages(req.files, activityType, studentId);

    res.json({
      success: true,
      message: 'Photos uploaded successfully',
      data: {
        photos: imagePaths,
        count: imagePaths.length
      }
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload photos'
    });
  }
};

// Get photo by filename
export const getPhoto = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check - ensure filename is safe
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filepath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    // Stream the file
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photo'
    });
  }
};

// Delete photo
export const deletePhoto = async (req, res) => {
  try {
    const { filename } = req.params;
    const studentId = req.user.id;
    
    // Security check
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Check if filename belongs to the student (security)
    if (!filename.includes(`_${studentId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const filepath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo'
    });
  }
};

// Get all photos for a student
export const getStudentPhotos = async (req, res) => {
  try {
    const studentId = req.user.id;
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const files = fs.readdirSync(uploadsDir);
    const studentPhotos = files
      .filter(file => file.includes(`_${studentId}_`))
      .map(file => ({
        filename: file,
        url: `/api/v1/files/photo/${file}`,
        uploadedAt: fs.statSync(path.join(uploadsDir, file)).mtime
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({
      success: true,
      data: studentPhotos
    });
  } catch (error) {
    console.error('Get student photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photos'
    });
  }
};
