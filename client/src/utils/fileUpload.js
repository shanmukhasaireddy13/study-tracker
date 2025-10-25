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
  const maxSize = 10 * 1024 * 1024; // 10MB
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
  
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File ${file.name} is not a supported file type. Only images, PDFs, and Word documents are allowed.`);
  }
  
  return true;
};

// Validate multiple files
export const validateFiles = (files) => {
  const maxFiles = 20;
  
  if (files.length > maxFiles) {
    throw new Error(`Too many files. Maximum is ${maxFiles} files.`);
  }
  
  Array.from(files).forEach(file => {
    validateFile(file);
  });
  
  return true;
};

// Get file type icon
export const getFileTypeIcon = (fileType) => {
  if (fileType.startsWith('image/')) {
    return '🖼️';
  } else if (fileType === 'application/pdf') {
    return '📄';
  } else if (fileType.includes('word')) {
    return '📝';
  }
  return '📎';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
