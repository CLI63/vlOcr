const express = require('express');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('../services/databaseService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const { requireAdmin } = authMiddleware;

function normalizeProviderPayload(body = {}) {
  return {
    id: body.id,
    label: body.label,
    value: body.value,
    providerType: body.providerType,
    description: body.description || '',
    enabled: body.enabled !== false,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
  };
}

function validateProviderPayload(payload) {
  if (!payload.id || !payload.label || !payload.value || !payload.providerType) {
    throw new Error('视觉模型配置的ID、名称、值和类型不能为空');
  }

  if (!['glm', 'paddle'].includes(payload.providerType)) {
    throw new Error('仅支持glm或paddle类型');
  }
}

async function persistModelVersion(modelId, actor, changeNote = '') {
  const model = await DatabaseService.getModelById(modelId);
  if (!model) {
    return;
  }

  const version = await DatabaseService.getNextModelVersion(modelId);
  await DatabaseService.saveModelVersion({
    id: uuidv4(),
    modelId,
    version,
    snapshotJson: {
      id: model.id,
      modelName: model.modelName,
      description: model.description,
      glmTips: model.glmTips,
      moreApi: model.moreApi,
      templateId: model.templateId || null,
      keyWords: model.keyWords || [],
    },
    changeNote,
    createdBy: actor?.userId || null,
  });
}

router.get('/providers', async (req, res) => {
  try {
    const includeDisabled = req.query.includeDisabled === 'true';
    const providers = await DatabaseService.getVisionModelProviders({ includeDisabled });
    res.json({ success: true, data: providers, message: '获取视觉模型配置成功' });
  } catch (error) {
    console.error('Failed to get providers:', error.message);
    res.status(500).json({ success: false, message: '获取视觉模型配置失败' });
  }
});

router.post('/providers', requireAdmin, async (req, res) => {
  try {
    const payload = normalizeProviderPayload(req.body);
    validateProviderPayload(payload);

    const existingById = await DatabaseService.getVisionModelProviderById(payload.id);
    if (existingById) {
      return res.status(400).json({ success: false, message: '视觉模型配置ID已存在' });
    }

    const existingByValue = await DatabaseService.getVisionModelProviderByValue(payload.value);
    if (existingByValue) {
      return res.status(400).json({ success: false, message: '视觉模型配置值已存在' });
    }

    const created = await DatabaseService.saveVisionModelProvider(payload);
    res.json({ success: true, data: created, message: '创建视觉模型配置成功' });
  } catch (error) {
    console.error('Failed to create provider:', error.message);
    const status = /不能为空|仅支持/.test(error.message) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || '创建视觉模型配置失败' });
  }
});

router.put('/providers/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await DatabaseService.getVisionModelProviderById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '视觉模型配置不存在' });
    }

    const payload = normalizeProviderPayload({
      ...req.body,
      id: req.params.id,
    });
    validateProviderPayload(payload);

    const existingByValue = await DatabaseService.getVisionModelProviderByValue(payload.value);
    if (existingByValue && existingByValue.id !== req.params.id) {
      return res.status(400).json({ success: false, message: '视觉模型配置值已存在' });
    }

    const oldValue = existing.value;
    if (oldValue !== payload.value) {
      const usageCount = await DatabaseService.countModelsByMoreApi(oldValue);
      if (usageCount > 0) {
        return res.status(409).json({ success: false, message: '该视觉模型配置已被业务模型引用，请先调整业务模型' });
      }
    }

    await DatabaseService.updateVisionModelProvider(req.params.id, payload);
    res.json({ success: true, data: true, message: '更新视觉模型配置成功' });
  } catch (error) {
    console.error('Failed to update provider:', error.message);
    const status = /不能为空|仅支持/.test(error.message) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || '更新视觉模型配置失败' });
  }
});

router.delete('/providers/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await DatabaseService.getVisionModelProviderById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '视觉模型配置不存在' });
    }

    const usageCount = await DatabaseService.countModelsByMoreApi(existing.value);
    if (usageCount > 0) {
      return res.status(409).json({ success: false, message: '该视觉模型配置已被业务模型引用，请先调整业务模型' });
    }

    await DatabaseService.deleteVisionModelProvider(req.params.id);
    res.json({ success: true, data: existing, message: '删除视觉模型配置成功' });
  } catch (error) {
    console.error('Failed to delete provider:', error.message);
    res.status(500).json({ success: false, message: '删除视觉模型配置失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const models = await DatabaseService.getAllModels();
    res.json({ success: true, data: models, message: '获取模型列表成功' });
  } catch (error) {
    console.error('Failed to get models:', error.message);
    res.status(500).json({ success: false, message: '获取模型列表失败' });
  }
});

router.get('/search/:keyword', async (req, res) => {
  try {
    const models = await DatabaseService.searchModels(req.params.keyword);
    res.json({ success: true, data: models, message: '搜索完成' });
  } catch (error) {
    console.error('Failed to search models:', error.message);
    res.status(500).json({ success: false, message: '搜索模型失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const model = await DatabaseService.getModelById(req.params.id);
    if (!model) {
      return res.status(404).json({ success: false, message: '模型不存在' });
    }
    res.json({ success: true, data: model, message: '获取模型成功' });
  } catch (error) {
    console.error('Failed to get model:', error.message);
    res.status(500).json({ success: false, message: '获取模型失败' });
  }
});

router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await DatabaseService.listModelVersions(req.params.id);
    res.json({ success: true, data: versions, message: '获取模型版本成功' });
  } catch (error) {
    console.error('Failed to get model versions:', error.message);
    res.status(500).json({ success: false, message: '获取模型版本失败' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const newModel = req.body;
    if (!newModel.id || !newModel.modelName) {
      return res.status(400).json({ success: false, message: 'ID和模型名称不能为空' });
    }

    const existingModel = await DatabaseService.getModelById(newModel.id);
    if (existingModel) {
      return res.status(400).json({ success: false, message: '模型ID已存在' });
    }

    const createdModel = await DatabaseService.saveModel(newModel);
    await persistModelVersion(newModel.id, req.user, '创建模型');
    res.json({ success: true, data: createdModel, message: '创建模型成功' });
  } catch (error) {
    console.error('Failed to create model:', error.message);
    const status = /不存在|停用/.test(error.message) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || '创建模型失败' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const existingModel = await DatabaseService.getModelById(req.params.id);
    if (!existingModel) {
      return res.status(404).json({ success: false, message: '模型不存在' });
    }

    const updatedModel = await DatabaseService.updateModel(req.params.id, req.body);
    await persistModelVersion(req.params.id, req.user, '更新模型');
    res.json({ success: true, data: updatedModel, message: '更新模型成功' });
  } catch (error) {
    console.error('Failed to update model:', error.message);
    const status = /不存在|停用/.test(error.message) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || '更新模型失败' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const existingModel = await DatabaseService.getModelById(req.params.id);
    if (!existingModel) {
      return res.status(404).json({ success: false, message: '模型不存在' });
    }

    const deleted = await DatabaseService.deleteModel(req.params.id);
    if (deleted) {
      res.json({ success: true, data: existingModel, message: '删除模型成功' });
    } else {
      res.status(500).json({ success: false, message: '删除模型失败' });
    }
  } catch (error) {
    console.error('Failed to delete model:', error.message);
    res.status(500).json({ success: false, message: '删除模型失败' });
  }
});

module.exports = router;
