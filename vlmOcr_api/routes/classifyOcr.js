const express = require('express');
const router = express.Router();
const classifier = require('../utils/classifier');
const { callGLMChat } = require('../ocrApi/GLMFlash');
const { callPaddleOCR } = require('../ocrApi/PaddleOcrVl');
const DatabaseService = require('../services/databaseService');
const { parseStructuredJson } = require('../utils/parseStructuredJson');
const { resolveRecognitionInput } = require('../utils/recognitionInput');
const { mapStructuredResult } = require('../utils/templateMapper');

async function findHistory(fileMd5, actor) {
  if (!fileMd5) return null;
  const result = await DatabaseService.searchImagesByFile(fileMd5, null, 1, 0, actor);
  return result.length > 0 ? result[0] : null;
}

async function recordHistory(record, actor) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  await DatabaseService.saveImageHistory({
    id,
    ...record,
    userId: actor.userId,
  });
  return id;
}

async function resolveStructuredResult(provider, imageUrl, tips, inputOptions = {}) {
  if (!provider) {
    return { msg: '未找到对应的视觉模型配置' };
  }

  if (provider.providerType === 'glm') {
    const response = await callGLMChat(imageUrl, tips, provider.value, inputOptions);
    const info = response.choices[0].message.content;
    return parseStructuredJson(info) || {};
  }

  if (provider.providerType === 'paddle') {
    const response = await callPaddleOCR(imageUrl, tips, inputOptions);
    return response.json || {};
  }

  return { msg: '暂未支持该视觉模型类型' };
}

router.post('/', async (req, res) => {
  try {
    const input = await resolveRecognitionInput(req);
    const imageUrl = input.imageUrl;
    const modelRes = await classifier.classifyImage(input.input, { allowLocalFile: input.allowLocalFile });
    const historyRecord = await findHistory(modelRes.fileMd5, req.user);

    if (historyRecord) {
      return res.json({
        bestMatch: historyRecord.modelName,
        allModel: historyRecord.allModel,
        ocrText: historyRecord.ocrText,
        ocrInfo: historyRecord.ocrInfo,
        imgSrc: historyRecord.imgSrc,
        fileId: historyRecord.fileId || input.fileId,
        fileMd5: historyRecord.fileMd5,
        sha256: input.sha256,
        fromHistory: true,
        timestamp: historyRecord.timestamp,
      });
    }

    const models = await DatabaseService.getAllModels();
    const bestModel = models.find((item) => item.modelName === modelRes.bestMatch);
    let template = null;

    if (modelRes.bestMatch !== '未知模型' && bestModel) {
      const provider = await DatabaseService.assertEnabledVisionProvider(bestModel.moreApi);
      modelRes.ocrInfo = await resolveStructuredResult(provider, input.input, bestModel.glmTips, { allowLocalFile: input.allowLocalFile });
      if (bestModel.templateId) {
        template = await DatabaseService.getTemplateById(bestModel.templateId);
      }
    }

    modelRes.fileId = input.fileId;
    modelRes.sha256 = input.sha256;
    modelRes.structuredJson = mapStructuredResult(template, modelRes.ocrInfo);
    modelRes.template = template;

    const historyId = await recordHistory({
      imgUrl: imageUrl,
      imgSrc: modelRes.imgSrc || '',
      fileMd5: modelRes.fileMd5 || '',
      ocrText: modelRes.ocrText || '',
      ocrInfo: modelRes.ocrInfo || {},
      structuredJson: modelRes.structuredJson || {},
      rawResponse: modelRes.ocrInfo || {},
      modelName: modelRes.bestMatch || '',
      allModel: modelRes.allModel || '',
      fileId: input.fileId,
      sourceType: input.fileId ? 'upload' : 'url',
      status: 'success',
    }, req.user);
    modelRes.id = historyId;
    modelRes.historyId = historyId;

    res.json(modelRes);
  } catch (error) {
    const status = /URL|HTTPS|白名单|内网|类型|大小|支持/.test(error.message) ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
