import express from 'express';
import userAuth from '../middleware/userAuth.js';
import multer from 'multer';
import { getCloudinarySignature, getImageKitAuth } from '../controllers/fileController.js';
import { uploadStudyPhotos, getStudyEntryPhotos, proxyUploadStudyPhotos } from '../controllers/photoController.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Cloudinary signed upload - returns signature details
router.post('/cloudinary-signature', getCloudinarySignature);

// ImageKit auth params for direct upload
router.post('/imagekit-auth', getImageKitAuth);

// Link already-uploaded Cloudinary assets to a study entry
router.post('/study-upload', uploadStudyPhotos);

// Fallback: upload files to server, then to Cloudinary, then link (no local storage)
const memoryUpload = multer({ storage: multer.memoryStorage() }).array('photos', 20);
router.post('/study-upload-proxy', memoryUpload, proxyUploadStudyPhotos);

// Get photos for specific study entry
router.get('/study-entry/:entryId/photos', getStudyEntryPhotos);

export default router;
