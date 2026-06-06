const express = require('express');
const router = express.Router();
const multer = require('multer');
const classifier = require('../utils/classifier');

const upload = multer({ dest: 'uploads/' });

/**
 * 分类接口
 * POST /classify
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log("文件分类接口")
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: '请上传图片地址' });
    }

    const modelRes = await classifier.classifyImage(req.body.imageUrl);
    console.log("识别结果：" + modelRes.bestMatch)
    res.json(modelRes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;