const express = require('express');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('../services/databaseService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const { requireAdmin } = authMiddleware;

router.get('/', async (req, res) => {
  try {
    const templates = await DatabaseService.listTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '获取模板失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await DatabaseService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '获取模板失败' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name) {
      return res.status(400).json({ success: false, message: '模板名称不能为空' });
    }
    if (!Array.isArray(payload.schemaJson) || payload.schemaJson.length === 0) {
      return res.status(400).json({ success: false, message: '模板字段不能为空' });
    }

    const id = uuidv4();
    await DatabaseService.saveTemplate({
      id,
      name: payload.name,
      description: payload.description,
      schemaJson: payload.schemaJson,
      version: 1,
      createdBy: req.user.userId,
    });
    const created = await DatabaseService.getTemplateById(id);
    res.json({ success: true, data: created, message: '模板创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '模板创建失败' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await DatabaseService.getTemplateById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    const payload = req.body || {};
    if (!payload.name) {
      return res.status(400).json({ success: false, message: '模板名称不能为空' });
    }
    if (!Array.isArray(payload.schemaJson) || payload.schemaJson.length === 0) {
      return res.status(400).json({ success: false, message: '模板字段不能为空' });
    }

    await DatabaseService.updateTemplate(req.params.id, {
      name: payload.name,
      description: payload.description,
      schemaJson: payload.schemaJson,
      version: Number(existing.version || 1) + 1,
    });
    const updated = await DatabaseService.getTemplateById(req.params.id);
    res.json({ success: true, data: updated, message: '模板更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '模板更新失败' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const usageCount = await DatabaseService.countModelsByTemplateId(req.params.id);
    if (usageCount > 0) {
      return res.status(409).json({ success: false, message: '模板已被模型绑定，请先解除绑定' });
    }
    const result = await DatabaseService.deleteTemplate(req.params.id);
    if (!result?.affectedRows) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    res.json({ success: true, message: '模板删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '模板删除失败' });
  }
});

module.exports = router;
