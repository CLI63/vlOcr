const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadDir);

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许所有文件类型
  cb(null, true);
};

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 限制10MB
  }
});

// 单文件上传接口
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有选择文件'
      });
    }

    // 构建文件访问URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 多文件上传接口
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有选择文件'
      });
    }

    const files = req.files.map(file => ({
      filename: file.originalname,
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: '文件上传成功',
      data: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 获取已上传文件列表
router.get('/list', async (req, res) => {
  try {
    const files = await fs.readdir(uploadDir);
    const fileList = files.filter(file => {
      // 过滤掉目录
      return fs.statSync(path.join(uploadDir, file)).isFile();
    }).map(file => {
      const stats = fs.statSync(path.join(uploadDir, file));
      return {
        filename: file,
        url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
        size: stats.size,
        uploadTime: stats.birthtime
      };
    });

    res.json({
      success: true,
      data: fileList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件列表失败',
      error: error.message
    });
  }
});

// 删除文件接口
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: '非法文件名'
      });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    await fs.remove(filePath);

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '文件删除失败',
      error: error.message
    });
  }
});

module.exports = router;