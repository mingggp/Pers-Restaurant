/**
 * Upload route (owner only)
 *
 * POST /api/upload      → รับไฟล์รูป (multipart, field name "image")
 *                         คืน { url: "https://...", publicId, ... }
 *
 * รองรับ 2 โหมด:
 *  • ถ้ามี env vars CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET → ใช้ Cloudinary (production)
 *  • ถ้าไม่มี → เก็บไฟล์ local disk ที่ backend/uploads/ (สำหรับ dev/local)
 */

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { requireRole } = require('../middleware/auth');

// ──────────────────────────────────────────────────────────
// Cloudinary setup (เลือกโหมดอัตโนมัติตาม env vars)
// ──────────────────────────────────────────────────────────
const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
if (USE_CLOUDINARY) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  console.log('[upload] mode: Cloudinary (', process.env.CLOUDINARY_CLOUD_NAME, ')');
} else {
  console.log('[upload] mode: local disk (set CLOUDINARY_* env vars for cloud storage)');
}

// ──────────────────────────────────────────────────────────
// Local disk (fallback / dev mode)
// ──────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!USE_CLOUDINARY && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ──────────────────────────────────────────────────────────
// File type config
// ──────────────────────────────────────────────────────────
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

// ใช้ memoryStorage เพื่อเก็บ buffer (Cloudinary upload จาก buffer)
// สำหรับ local mode จะ write จาก buffer ลง disk เอง
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!MIME_TO_EXT[file.mimetype]) {
      return cb(new Error('รองรับเฉพาะ JPG, PNG, WebP เท่านั้น'));
    }
    cb(null, true);
  },
});

// ──────────────────────────────────────────────────────────
// Upload helpers
// ──────────────────────────────────────────────────────────
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'pers-restaurant/menu',
        resource_type: 'image',
        // Cloudinary จะแปลง WebP/AVIF อัตโนมัติเมื่อ browser รองรับ
        // เรา resize ฝั่ง client แล้ว (≤ 800px) แต่กัน upload รูปใหญ่เกินไป
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

function saveToLocalDisk(buffer, mimetype) {
  const ext = MIME_TO_EXT[mimetype] || '.bin';
  const filename = crypto.randomBytes(16).toString('hex') + ext;
  const fullPath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    bytes: buffer.length,
  };
}

// ──────────────────────────────────────────────────────────
// POST /api/upload
// ──────────────────────────────────────────────────────────
router.post(
  '/',
  requireRole('owner'),
  (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'รูปต้องไม่เกิน 5MB' });
        }
        return res.status(400).json({ error: err.message || 'อัปโหลดไม่สำเร็จ' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'กรุณาแนบไฟล์ (field name: image)' });
      }

      try {
        if (USE_CLOUDINARY) {
          const result = await uploadToCloudinary(req.file.buffer);
          return res.status(201).json({
            url:      result.secure_url,
            publicId: result.public_id,
            bytes:    result.bytes,
            width:    result.width,
            height:   result.height,
            format:   result.format,
            provider: 'cloudinary',
          });
        }

        // Local fallback
        const local = saveToLocalDisk(req.file.buffer, req.file.mimetype);
        return res.status(201).json({
          ...local,
          mimetype: req.file.mimetype,
          provider: 'local',
        });
      } catch (uploadErr) {
        console.error('[upload] failed:', uploadErr);
        return res.status(500).json({ error: 'อัปโหลดไปยังที่เก็บไม่สำเร็จ — กรุณาลองใหม่' });
      }
    });
  }
);

module.exports = router;
