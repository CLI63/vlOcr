const express = require('express');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('../services/databaseService');

const router = express.Router();

router.get('/history/:historyId', async (req, res) => {
  try {
    const history = await DatabaseService.getImageById(req.params.historyId, req.user);
    if (!history) {
      return res.status(404).json({ success: false, message: '识别记录不存在' });
    }

    const correction = await DatabaseService.getCorrectionByHistoryId(req.params.historyId);
    res.json({ success: true, data: correction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '获取校对记录失败' });
  }
});

router.post('/history/:historyId', async (req, res) => {
  try {
    const history = await DatabaseService.getImageById(req.params.historyId, req.user);
    if (!history) {
      return res.status(404).json({ success: false, message: '识别记录不存在' });
    }

    const payload = req.body || {};
    const originalJson = payload.originalJson || history.structuredJson || history.ocrInfo || {};
    const correctedJson = payload.correctedJson || {};
    const existing = await DatabaseService.getCorrectionByHistoryId(req.params.historyId);

    if (existing) {
      await DatabaseService.updateCorrection(existing.id, {
        originalJson,
        correctedJson,
        status: payload.status || 'draft',
        correctedBy: req.user.userId,
        correctedAt: new Date(),
      });
    } else {
      await DatabaseService.saveCorrection({
        id: uuidv4(),
        historyId: req.params.historyId,
        originalJson,
        correctedJson,
        status: payload.status || 'draft',
        correctedBy: req.user.userId,
        correctedAt: new Date(),
      });
    }

    await DatabaseService.updateImageHistory(req.params.historyId, {
      corrected_json: JSON.stringify(correctedJson),
      status: payload.status === 'confirmed' ? 'confirmed' : 'correcting',
    });

    const saved = await DatabaseService.getCorrectionByHistoryId(req.params.historyId);
    res.json({ success: true, data: saved, message: '校对结果保存成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '保存校对结果失败' });
  }
});

router.post('/:id/confirm', async (req, res) => {
  try {
    const correction = await DatabaseService.getCorrectionById(req.params.id);
    if (!correction) {
      return res.status(404).json({ success: false, message: '校对记录不存在' });
    }

    const history = await DatabaseService.getImageById(correction.history_id, req.user);
    if (!history) {
      return res.status(404).json({ success: false, message: '识别记录不存在' });
    }

    await DatabaseService.updateCorrection(req.params.id, {
      originalJson: correction.originalJson,
      correctedJson: correction.correctedJson,
      status: 'confirmed',
      correctedBy: req.user.userId,
      correctedAt: new Date(),
    });
    await DatabaseService.updateImageHistory(correction.history_id, {
      corrected_json: JSON.stringify(correction.correctedJson),
      status: 'confirmed',
    });

    const saved = await DatabaseService.getCorrectionById(req.params.id);
    res.json({ success: true, data: saved, message: '校对结果已确认' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '确认校对结果失败' });
  }
});

module.exports = router;
