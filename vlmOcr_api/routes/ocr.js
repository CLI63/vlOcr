const express = require('express');
const router = express.Router();
const { callGLMChat } = require('../ocrApi/GLMFlash');

/**
 * 调用智谱大模型接口
 * POST /ocr/glm-chat
 * 请求体参数:
 * {
 *   "model": "模型名称",
 *   "messages": [
 *     {"role": "user", "content": "内容"}
 *   ]
 * }
 */
router.post('/glm-chat', async (req, res) => {
  try {
    const { imgUrl, tips } = req.body;
    const response = await callGLMChat(imgUrl, tips);
    var info = response.choices[0].message.content;
    res.json({
      code: 200,
      message: '请求成功',
      data: JSON.parse(info)
    });
  } catch (error) {
    console.error('大模型接口调用失败:', error);
    res.status(500).json({ error: error.message || '大模型服务请求失败' });
  }
});

module.exports = router;
