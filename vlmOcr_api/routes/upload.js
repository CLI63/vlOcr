const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const publicRouter = express.Router();
const config = require('../config/appConfig');
const DatabaseService = require('../services/databaseService');
const {
  allowedExtensions,
  createSafeFilename,
  getUploadLimitBytes,
  isAllowedFile,
  getUploadPathByStoredFilename,
} = require('../utils/fileSecurity');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadDir);

function buildFileUrl(req, filename) {
  const baseUrl = config.publicFileBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/upload/files/${filename}`;
}

function buildFileUrlById(req, fileId) {
  const baseUrl = config.publicFileBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/upload/files/${fileId}`;
}

function validateFilename(filename) {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  return allowedExtensions.has(path.extname(filename).toLowerCase());
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    try {
      cb(null, createSafeFilename(file.originalname));
    } catch (error) {
      cb(error);
    }
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (!isAllowedFile(file)) {
      return cb(new Error('仅支持 JPG、PNG、WEBP 或 PDF 文件'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: getUploadLimitBytes(),
  },
});

function hashFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function persistUploadedFile(req, file) {
  const id = uuidv4();
  const saved = await DatabaseService.saveUploadedFile({
    id,
    storedFilename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    sha256: hashFile(file.path),
    ownerUserId: req.user?.userId || null,
  });

  return {
    id: saved.id,
    originalName: saved.original_name,
    filename: saved.original_name,
    storedFilename: saved.stored_filename,
    mimeType: saved.mime_type,
    mimetype: saved.mime_type,
    size: saved.size,
    sha256: saved.sha256,
    url: buildFileUrlById(req, saved.id),
    legacyUrl: buildFileUrl(req, saved.stored_filename),
  };
}

router.post('/single', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '没有选择文件' });
  }

  const fileData = await persistUploadedFile(req, req.file);
  res.json({
    success: true,
    message: '文件上传成功',
    data: fileData,
  });
});

router.post('/multiple', upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: '没有选择文件' });
  }

  const files = [];
  for (const file of req.files) {
    files.push(await persistUploadedFile(req, file));
  }

  res.json({ success: true, message: '文件上传成功', data: files });
});

publicRouter.get('/:fileId', async (req, res) => {
  const fileId = req.params.fileId;

  try {
    const fileMeta = await DatabaseService.getUploadedFileById(fileId, { role: 'admin' });
    if (fileMeta) {
      const filePath = getUploadPathByStoredFilename(fileMeta.stored_filename);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.sendFile(filePath);
    }
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message || '文件不存在' });
  }

  if (!validateFilename(fileId)) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  const filePath = path.join(uploadDir, fileId);
  if (!await fs.pathExists(filePath)) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath);
});

router.get('/list', async (req, res) => {
  try {
    const files = await DatabaseService.listUploadedFiles(req.user);
    const fileList = files.map((file) => ({
      id: file.id,
      filename: file.original_name,
      originalName: file.original_name,
      storedFilename: file.stored_filename,
      mimeType: file.mime_type,
      size: file.size,
      sha256: file.sha256,
      url: buildFileUrlById(req, file.id),
      uploadTime: file.created_at,
    }));

    res.json({ success: true, data: fileList });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取文件列表失败', error: error.message });
  }
});

router.delete('/:fileId', async (req, res) => {
  try {
    const file = await DatabaseService.markUploadedFileDeleted(req.params.fileId, req.user);
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    const filePath = path.join(uploadDir, file.stored_filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
    res.json({ success: true, message: '文件删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '文件删除失败', error: error.message });
  }
});

router.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  next();
});

module.exports = router;
module.exports.publicRouter = publicRouter;
