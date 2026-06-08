const express = require('express');
const router = express.Router();
const classifier = require('../utils/classifier');
const { resolveRecognitionInput } = require('../utils/recognitionInput');

/**
 * 分类接口
 * POST /classify
 */
router.post('/', async (req, res) => {
  try {
    const input = await resolveRecognitionInput(req);
    const modelRes = await classifier.classifyImage(input.input, { allowLocalFile: input.allowLocalFile });
    modelRes.fileId = input.fileId;
    modelRes.sha256 = input.sha256;
    res.json(modelRes);
  } catch (error) {
    const status = /URL|HTTPS|白名单|内网|类型|大小|支持|本地|上传文件/.test(error.message) ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
