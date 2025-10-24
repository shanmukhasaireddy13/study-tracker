import axios from 'axios';

// Upload photos for a study entry
export const uploadStudyPhotos = async (entryId, activityType, files, backendUrl) => {
  try {
    const formData = new FormData();
    formData.append('entryId', entryId);
    formData.append('activityType', activityType);
    
    // Add files to FormData
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    const response = await axios.post(`${backendUrl}/api/v1/files/study-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error('Upload photos error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload photos');
  }
};

// Get photos for a study entry
export const getStudyEntryPhotos = async (entryId, backendUrl) => {
  try {
    const response = await axios.get(`${backendUrl}/api/v1/files/study-entry/${entryId}/photos`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Get photos error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get photos');
  }
};

// Get photo URL
export const getPhotoUrl = (photoPath, backendUrl) => {
  if (!photoPath) return null;
  
  // If it's already a full URL, return as is
  if (photoPath.startsWith('http')) {
    return photoPath;
  }
  
  // If it starts with /uploads, it's already a relative path
  if (photoPath.startsWith('/uploads')) {
    return `${backendUrl}${photoPath}`;
  }
  
  // Otherwise, construct the full URL
  return `${backendUrl}/uploads/${photoPath}`;
};

// Validate file before upload
export const validateFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File ${file.name} is not a supported image type.`);
  }
  
  return true;
};

// Validate multiple files
export const validateFiles = (files) => {
  const maxFiles = 10;
  
  if (files.length > maxFiles) {
    throw new Error(`Too many files. Maximum is ${maxFiles} files.`);
  }
  
  Array.from(files).forEach(file => {
    validateFile(file);
  });
  
  return true;
};
