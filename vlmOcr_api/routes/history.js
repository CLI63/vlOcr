const express = require('express');
const DatabaseService = require('../services/databaseService');
const router = express.Router();

router.get('/models', async (req, res) => {
  try {
    const modelNames = await DatabaseService.getAllModelNames(req.user);
    res.json(modelNames);
  } catch (error) {
    console.error('Failed to get model names:', error.message);
    res.status(500).json({ error: '获取模型列表失败', message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, fileMd5, imgUrl, modelName, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    let data = [];
    let total = 0;

    if (search) {
      data = await DatabaseService.searchImages(search, limitNum, offset, req.user);
      total = await DatabaseService.countSearchImages(search, req.user);
    } else if (fileMd5 || imgUrl || modelName) {
      if (modelName) {
        data = await DatabaseService.getImagesByModel(modelName, limitNum, offset, req.user, { status });
        total = await DatabaseService.countImages({ modelName, status }, req.user);
      } else {
        data = await DatabaseService.searchImagesByFile(fileMd5, imgUrl, limitNum, offset, req.user, { status });
        total = await DatabaseService.countImages({ fileMd5, imgUrl, status }, req.user);
      }
    } else {
      data = await DatabaseService.getImageHistory(limitNum, offset, req.user, { status });
      total = await DatabaseService.countImages({ status }, req.user);
    }

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Failed to get history records:', error.message);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await DatabaseService.getImageDetailById(req.params.id, req.user);
    if (!record) {
      return res.status(404).json({ error: '未找到记录' });
    }
    res.json(record);
  } catch (error) {
    console.error('Failed to get history record:', error.message);
    res.status(500).json({ error: '获取记录失败', message: error.message });
  }
});

router.delete('/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const isMd5 = /^[a-f0-9]{32}$/i.test(identifier);
    const deletedCount = isMd5
      ? await DatabaseService.deleteImageByMd5(identifier, req.user)
      : await DatabaseService.deleteImageHistory(identifier, req.user);
    if (deletedCount === 0) {
      return res.status(404).json({ error: '记录不存在', message: '没有找到可删除的记录' });
    }

    res.json({
      message: '删除成功',
      deletedCount,
      identifier,
    });
  } catch (error) {
    console.error('Failed to delete history record:', error.message);
    res.status(500).json({ error: '删除历史记录失败', message: error.message });
  }
});

module.exports = router;
