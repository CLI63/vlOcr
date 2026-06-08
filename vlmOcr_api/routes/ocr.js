const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { DEFAULT_MODEL: DEFAULT_GLM_MODEL, callGLMChat } = require('../ocrApi/GLMFlash');
const { MODEL: PADDLE_MODEL, callPaddleOCR } = require('../ocrApi/PaddleOcrVl');
const DatabaseService = require('../services/databaseService');
const { parseStructuredJson } = require('../utils/parseStructuredJson');
const { resolveRecognitionInput } = require('../utils/recognitionInput');
const { mapStructuredResult } = require('../utils/templateMapper');

function getImageUrl(req) {
  return req.body?.imageUrl || req.body?.imgUrl || '';
}

async function findHistory(imageUrl, actor) {
  if (!imageUrl) return null;
  const result = await DatabaseService.searchImagesByFile(null, imageUrl, 1, 0, actor);
  return result.length > 0 ? result[0] : null;
}

async function recordHistory(record, actor) {
  await DatabaseService.saveImageHistory({
    id: uuidv4(),
    ...record,
    userId: actor?.userId || null,
  });
}

function normalizeHistoryResponse(historyRecord) {
  return {
    code: 200,
    message: '请求成功',
    data: {
      model: historyRecord.modelName || PADDLE_MODEL,
      rawText: historyRecord.ocrText || '',
      result: historyRecord.ocrInfo || {},
      structuredJson: historyRecord.structuredJson || historyRecord.ocrInfo || {},
      correctedJson: historyRecord.correctedJson || {},
      imgUrl: historyRecord.imgUrl || '',
      imgSrc: historyRecord.imgSrc || '',
      fileId: historyRecord.fileId || null,
      fileMd5: historyRecord.fileMd5 || '',
      fromHistory: true,
      timestamp: historyRecord.created_at || null,
    },
  };
}

async function handlePaddleOcr(req, res) {
  try {
    const imageUrl = getImageUrl(req);
    const { tips, useHistory = false } = req.body || {};

    const input = await resolveRecognitionInput(req);

    if (useHistory) {
      const historyRecord = await findHistory(input.imageUrl || imageUrl, req.user);
      if (historyRecord) {
        return res.json(normalizeHistoryResponse(historyRecord));
      }
    }

    const response = await callPaddleOCR(input.input, tips, { allowLocalFile: input.allowLocalFile });
    let template = null;
    if (req.body?.modelName) {
      const model = await DatabaseService.getModelByName(req.body.modelName);
      if (model?.templateId) {
        template = await DatabaseService.getTemplateById(model.templateId);
      }
    }
    const structuredJson = mapStructuredResult(template, response.json || {});

    await recordHistory({
      imgUrl: input.imageUrl,
      imgSrc: response.outputDir || '',
      fileMd5: '',
      ocrText: response.rawText || '',
      ocrInfo: response.json || {},
      structuredJson,
      rawResponse: response.jsonlItems || response.json || {},
      modelName: response.model || PADDLE_MODEL,
      allModel: [{ modelName: response.model || PADDLE_MODEL, score: 1 }],
      fileId: input.fileId,
      sourceType: input.fileId ? 'upload' : 'url',
      status: 'success',
    }, req.user);

    res.json({
      code: 200,
      message: '请求成功',
      data: {
        model: response.model,
        jobId: response.jobId,
        state: response.state,
        rawText: response.rawText,
        result: response.json,
        structuredJson,
        template,
        fileId: input.fileId,
        sha256: input.sha256,
        markdownFiles: response.markdownFiles,
        jsonlUrl: response.jsonlUrl,
        assets: response.assets,
        progress: response.progress,
      },
    });
  } catch (error) {
    console.error('PaddleOCR-VL接口调用失败:', error);
    const status = /URL|HTTPS|白名单|内网|类型|大小|支持|缺少|不存在/.test(error.message) ? 400 : 500;
    res.status(status).json({ error: error.message || 'PaddleOCR-VL 服务请求失败' });
  }
}

router.post('/glm-chat', async (req, res) => {
  try {
    const { tips, model = DEFAULT_GLM_MODEL } = req.body;
    const input = await resolveRecognitionInput(req);
    const response = await callGLMChat(input.input, tips, model, { allowLocalFile: input.allowLocalFile });
    const info = response.choices[0].message.content;
    res.json({
      code: 200,
      message: '请求成功',
      data: parseStructuredJson(info),
    });
  } catch (error) {
    console.error('大模型接口调用失败:', error);
    res.status(500).json({ error: error.message || '大模型服务请求失败' });
  }
});

router.post('/', handlePaddleOcr);
router.post('/paddle-vl', handlePaddleOcr);
router.post('/paddle-vl-1.6', handlePaddleOcr);

module.exports = router;
