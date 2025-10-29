import axios from 'axios';

// Get ImageKit auth params from backend
const getImageKitAuth = async (backendUrl) => {
  const { data } = await axios.post(
    `${backendUrl}/api/v1/files/imagekit-auth`,
    {},
    { withCredentials: true }
  );
  if (!data?.success) throw new Error(data?.message || 'Failed to get ImageKit auth');
  return data.data; // { token, expire, signature, publicKey, urlEndpoint }
};

// Upload a single file directly to ImageKit
const uploadSingleToImageKit = async (file, cfg) => {
  const endpoint = `https://upload.imagekit.io/api/v1/files/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('fileName', file.name || 'upload');
  fd.append('token', cfg.token);
  fd.append('expire', cfg.expire);
  fd.append('signature', cfg.signature);
  fd.append('publicKey', cfg.publicKey);
  // Optional folder on ImageKit
  fd.append('folder', '/study_uploads');

  const { data } = await axios.post(endpoint, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    // Critical: do NOT send cookies to ImageKit to avoid CORS credentials restriction
    withCredentials: false
  });
  return data; // includes url, thumbnailUrl, fileId, name, mime
};

// Upload photos for a study entry (direct to Cloudinary, then link on server)
export const uploadStudyPhotos = async (entryId, activityType, files, backendUrl) => {
  try {
    // 1) Get ImageKit auth from backend
    const cfg = await getImageKitAuth(backendUrl);

    // 2) Upload all files directly to ImageKit
    let uploads;
    try {
      uploads = await Promise.all(Array.from(files).map((f) => uploadSingleToImageKit(f, cfg)));
    } catch (err) {
      // Network issues when calling Cloudinary directly from browser: fallback to server proxy
      if (err?.code === 'ERR_NETWORK') {
        const fd = new FormData();
        fd.append('entryId', entryId);
        fd.append('activityType', activityType);
        Array.from(files).forEach((file) => fd.append('photos', file));
        const { data } = await axios.post(
          `${backendUrl}/api/v1/files/study-upload-proxy`,
          fd,
          { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
        );
        if (!data?.success) throw new Error(data?.message || 'Proxy upload failed');
        return data; // already contains images/documents + entry
      }
      throw err;
    }

    // 3) Split into images vs documents by mime
    const images = [];
    const documents = [];
    uploads.forEach((u) => {
      if (u.mime && u.mime.startsWith('image/')) images.push(u.url); else documents.push(u.url);
    });

    // 4) Link uploaded asset URLs to study entry on backend
    const response = await axios.post(
      `${backendUrl}/api/v1/files/study-upload`,
      { entryId, activityType, images, documents },
      { withCredentials: true }
    );
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
  // Cloudinary URLs (https) are returned as-is
  if (photoPath.startsWith('http')) return photoPath;
  // Backwards compatibility: fall back to server uploads path if old data exists
  if (photoPath.startsWith('/uploads')) return `${backendUrl}${photoPath}`;
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
