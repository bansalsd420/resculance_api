const path = require('path');
const multer = require('multer');
const fs = require('fs');

// TODO: Cloud Storage Integration
// Currently using local disk storage. To use cloud storage (aaPanel, S3, etc.):
// 1. Add storage credentials to .env (see .env.example for STORAGE_* variables)
// 2. Install appropriate SDK: npm install @aws-sdk/client-s3 or multer-s3
// 3. Replace multer.diskStorage with cloud storage configuration
// 4. Update uploadProfileImage controllers to use cloud URLs instead of local paths

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'profiles');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.warn('Failed to ensure uploads/profiles directory:', e.message);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safe = `${req.user?.id || 'anon'}-${Date.now()}${ext}`;
    cb(null, safe);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG/PNG/WebP images are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = upload;
