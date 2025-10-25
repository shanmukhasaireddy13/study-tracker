import studyEntryModel from '../models/studyEntryModel.js';
import { processImages, processMixedFiles } from '../middleware/upload.js';

// Upload photos and update study entry
export const uploadStudyPhotos = async (req, res) => {
  try {
    const { entryId, activityType } = req.body;
    const studentId = req.user.id;

    if (!entryId || !activityType) {
      return res.status(400).json({
        success: false,
        message: 'Entry ID and activity type are required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

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

    // Process and save mixed files (images and documents)
    const { images, documents } = await processMixedFiles(req.files, activityType, studentId);

    // Update the study entry with file paths
    const updateData = {};
    updateData[`${activityType}.photos`] = images;
    updateData[`${activityType}.documents`] = documents;
    updateData[`${activityType}.completed`] = true;

    const updatedEntry = await studyEntryModel.findByIdAndUpdate(
      entryId,
      { $set: updateData },
      { new: true }
    ).populate('subject lesson');

    res.json({
      success: true,
      message: 'Files uploaded successfully',
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
