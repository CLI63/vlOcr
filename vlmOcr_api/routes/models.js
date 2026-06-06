const express = require('express');
const DatabaseService = require('../services/databaseService');
const router = express.Router();

// 获取所有模型
router.get('/', async (req, res) => {
  try {
    const models = await DatabaseService.getAllModels();
    res.json({
      success: true,
      data: models,
      message: '获取模型列表成功'
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型列表失败'
    });
  }
});

// 根据ID获取单个模型
router.get('/:id', async (req, res) => {
  try {
    const model = await DatabaseService.getModelById(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    res.json({
      success: true,
      data: model,
      message: '获取模型成功'
    });
  } catch (error) {
    console.error('获取模型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型失败'
    });
  }
});

// 创建新模型
router.post('/', async (req, res) => {
  try {
    const newModel = req.body;
    
    // 验证必填字段
    if (!newModel.id || !newModel.modelName) {
      return res.status(400).json({
        success: false,
        message: 'ID和模型名称不能为空'
      });
    }
    
    // 检查ID是否已存在
    const existingModel = await DatabaseService.getModelById(newModel.id);
    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: '模型ID已存在'
      });
    }
    
    const createdModel = await DatabaseService.saveModel(newModel);
    
    res.json({
      success: true,
      data: createdModel,
      message: '创建模型成功'
    });
  } catch (error) {
    console.error('创建模型失败:', error);
    res.status(500).json({
      success: false,
      message: '创建模型失败'
    });
  }
});

// 更新模型
router.put('/:id', async (req, res) => {
  try {
    const existingModel = await DatabaseService.getModelById(req.params.id);
    
    if (!existingModel) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    const updatedModel = await DatabaseService.updateModel(req.params.id, req.body);
    
    res.json({
      success: true,
      data: updatedModel,
      message: '更新模型成功'
    });
  } catch (error) {
    console.error('更新模型失败:', error);
    res.status(500).json({
      success: false,
      message: '更新模型失败'
    });
  }
});

// 删除模型
router.delete('/:id', async (req, res) => {
  try {
    const existingModel = await DatabaseService.getModelById(req.params.id);
    
    if (!existingModel) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    const deleted = await DatabaseService.deleteModel(req.params.id);
    
    if (deleted) {
      res.json({
        success: true,
        data: existingModel,
        message: '删除模型成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '删除模型失败'
      });
    }
  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({
      success: false,
      message: '删除模型失败'
    });
  }
});

// 搜索模型
router.get('/search/:keyword', async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const models = await DatabaseService.searchModels(keyword);
    
    res.json({
      success: true,
      data: models,
      message: '搜索完成'
    });
  } catch (error) {
    console.error('搜索模型失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索模型失败'
    });
  }
});

module.exports = router;