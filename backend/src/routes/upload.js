/**
 * Upload route (owner only)
 *
 * POST /api/upload      → รับไฟล์รูป (multipart, field name "image")
 *                         คืน { url: "/uploads/xxxx.jpg" }
 *
 * หมายเหตุ: เก็บไฟล์บน local disk ของ backend (โฟลเดอร์ ./uploads)
 * บน Render free tier ดิสก์เป็น ephemeral — ไฟล์จะหายตอน redeploy
 * Production จริงควรเปลี่ยนไปใช้ S3/Cloudinary/Render Persistent Disk
 */

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { requireRole } = require('../middleware/auth');

// โฟลเดอร์เก็บไฟล์ (สร้างถ้ายังไม่มี)
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ชนิดไฟล์ที่อนุญาต
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.bin';
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
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

// POST /api/upload
router.post(
  '/',
  requireRole('owner'),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'รูปต้องไม่เกิน 5MB' });
          }
        }
        return res.status(400).json({ error: err.message || 'อัปโหลดไม่สำเร็จ' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'กรุณาแนบไฟล์ (field name: image)' });
      }
      const publicUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({
        url:      publicUrl,
        filename: req.file.filename,
        size:     req.file.size,
        mimetype: req.file.mimetype,
      });
    });
  }
);

module.exports = router;
