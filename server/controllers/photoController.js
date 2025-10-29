import studyEntryModel from '../models/studyEntryModel.js';

// Upload photos and update study entry
export const uploadStudyPhotos = async (req, res) => {
  try {
    const { entryId, activityType, images = [], documents = [] } = req.body;
    const studentId = req.user.id;

    if (!entryId || !activityType) {
      return res.status(400).json({
        success: false,
        message: 'Entry ID and activity type are required'
      });
    }

    // Expect Cloudinary URLs already uploaded from client

    // Find the study entry
    const studyEntry = await studyEntryModel.findOne({
      _id: entryId,
      student: studentId
    });

    if (!studyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Study entry not found'
      });
    }

    // Update the study entry with Cloudinary URLs
    const updateData = {};
    updateData[`${activityType}.photos`] = images;
    // Documents in schema are objects; accept strings from client and shape here
    const shapedDocuments = (documents || []).map((doc) => {
      if (typeof doc === 'string') {
        return { path: doc };
      }
      // If client sends structured objects, trust those fields
      return {
        path: doc.path || doc.url || '',
        originalName: doc.originalName || doc.name || '',
        type: doc.type || doc.mime || '',
        size: typeof doc.size === 'number' ? doc.size : undefined
      };
    });
    updateData[`${activityType}.documents`] = shapedDocuments;
    updateData[`${activityType}.completed`] = true;

    const updatedEntry = await studyEntryModel.findByIdAndUpdate(
      entryId,
      { $set: updateData },
      { new: true }
    ).populate('subject lesson');

    res.json({
      success: true,
      message: 'Files linked successfully',
      data: {
        entry: updatedEntry,
        images: images,
        documents: documents,
        totalFiles: images.length + documents.length
      }
    });
  } catch (error) {
    console.error('Upload study photos error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload photos'
    });
  }
};

// Proxy upload: accept files in request, upload to Cloudinary on server, then link to entry
export const proxyUploadStudyPhotos = async (req, res) => {
  try {
    const { entryId, activityType } = req.body;
    const studentId = req.user.id;

    if (!entryId || !activityType) {
      return res.status(400).json({ success: false, message: 'Entry ID and activity type are required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const studyEntry = await studyEntryModel.findOne({ _id: entryId, student: studentId });
    if (!studyEntry) {
      return res.status(404).json({ success: false, message: 'Study entry not found' });
    }

    const imagekit = (await import('../utils/imagekit.js')).default;
    const folder = process.env.IMAGEKIT_UPLOAD_FOLDER || '/study_uploads';

    const uploadBuffer = (file) => new Promise((resolve, reject) => {
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder,
        useUniqueFileName: true
      }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    const results = await Promise.all(req.files.map((f) => uploadBuffer(f)));

    const images = [];
    const documents = [];
    results.forEach((u) => {
      if (u.mime && u.mime.startsWith('image/')) {
        images.push(u.url);
      } else {
        documents.push({
          path: u.url,
          originalName: u.name,
          type: u.mime,
          size: typeof u.size === 'number' ? u.size : undefined
        });
      }
    });

    const updateData = {};
    updateData[`${activityType}.photos`] = images;
    updateData[`${activityType}.documents`] = documents;
    updateData[`${activityType}.completed`] = true;

    const updatedEntry = await studyEntryModel.findByIdAndUpdate(
      entryId,
      { $set: updateData },
      { new: true }
    ).populate('subject lesson');

    return res.json({
      success: true,
      message: 'Files uploaded and linked successfully',
      data: { entry: updatedEntry, images, documents, totalFiles: images.length + documents.length }
    });
  } catch (error) {
    console.error('Proxy upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to upload files' });
  }
};

// Get photos for a specific study entry
export const getStudyEntryPhotos = async (req, res) => {
  try {
    const { entryId } = req.params;
    const studentId = req.user.id;

    const studyEntry = await studyEntryModel.findOne({
      _id: entryId,
      student: studentId
    });

    if (!studyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Study entry not found'
      });
    }

    const photos = {
      grammar: studyEntry.grammar?.photos || [],
      writing: studyEntry.writing?.photos || [],
      mathPractice: studyEntry.mathPractice?.photos || [],
      sciencePractice: studyEntry.sciencePractice?.photos || [],
      socialPractice: studyEntry.socialPractice?.photos || []
    };

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('Get study entry photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photos'
    });
  }
};
