import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';
import { uploadPhotos, getPhoto, deletePhoto, getStudentPhotos } from '../controllers/fileController.js';
import { uploadStudyPhotos, getStudyEntryPhotos } from '../controllers/photoController.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Upload photos
router.post('/upload', uploadMultiple, handleUploadError, uploadPhotos);

// Get photo by filename
router.get('/photo/:filename', getPhoto);

// Delete photo
router.delete('/photo/:filename', deletePhoto);

// Get all photos for current student
router.get('/student-photos', getStudentPhotos);

// Upload photos for study entry
router.post('/study-upload', uploadMultiple, handleUploadError, uploadStudyPhotos);

// Get photos for specific study entry
router.get('/study-entry/:entryId/photos', getStudyEntryPhotos);

export default router;
