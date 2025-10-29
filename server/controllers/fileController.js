import crypto from 'crypto';
import imagekit from '../utils/imagekit.js';

// Generate Cloudinary signature for signed direct uploads from the client
export const getCloudinarySignature = async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const defaultFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'study_uploads';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration missing on server'
      });
    }

    const { folder } = req.body || {};
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      folder: folder || defaultFolder,
      timestamp
    };

    const toQueryString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(toQueryString + apiSecret)
      .digest('hex');

    return res.json({
      success: true,
      data: {
        timestamp,
        signature,
        apiKey,
        cloudName,
        folder: paramsToSign.folder,
        uploadPreset
      }
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Cloudinary signature'
    });
  }
};

// ImageKit authentication parameters for client-side direct upload
export const getImageKitAuth = async (req, res) => {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!publicKey || !urlEndpoint || !process.env.IMAGEKIT_PRIVATE_KEY) {
      return res.status(500).json({ success: false, message: 'ImageKit configuration missing on server' });
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();
    return res.json({
      success: true,
      data: {
        ...authenticationParameters,
        publicKey,
        urlEndpoint
      }
    });
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create ImageKit auth' });
  }
};

