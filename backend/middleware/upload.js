import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sole-style',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }],
  },
});

// ✅ Configure multer with limits and error handling
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP allowed.`), false);
    }
  },
});

// ✅ Wrapper to handle request aborts
export const handleUpload = (fieldName) => {
  const uploadMiddleware = upload.array(fieldName);

  return (req, res, next) => {
    // Track if request was aborted
    let aborted = false;

    req.on('close', () => {
      if (!aborted && (!req.file && !req.files?.length)) {
        aborted = true;
        console.log('⚠️ Upload request aborted by client');
      }
    });

    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'File too large. Max 5MB per file.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ success: false, message: 'Too many files. Max 10 files allowed.' });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
};

export default upload;