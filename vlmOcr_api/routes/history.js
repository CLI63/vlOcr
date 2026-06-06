const express = require('express');
const DatabaseService = require('../services/databaseService');
const { MySQLHelper } = require('../utils/mysql');
const router = express.Router();

/**
 * 分页查询历史记录
 * GET /api/history
 * 查询参数：
 * - page: 页码，默认1
 * - limit: 每页条数，默认10
 * - imgUrl: 模糊匹配图片URL
 * - fileMd5: 精确匹配文件MD5
 * - modelName: 精确匹配模型名称
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, fileMd5, imgUrl, modelName } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let data, total;

    if (search) {
      // 搜索功能
      data = await DatabaseService.searchImages(search, limitNum);
      total = data.length; // 简单处理，实际需要更精确的计数
    } else if (fileMd5 || imgUrl || modelName) {
      // 按条件过滤查询
      if (fileMd5 || imgUrl) {
        data = await DatabaseService.searchImagesByFile(fileMd5, imgUrl, limitNum, offset);
        
        // 获取总数
        let countSql = `SELECT COUNT(*) as count FROM img_history WHERE 1=1`;
        const countParams = [];
        
        if (fileMd5) {
          countSql += ` AND fileMd5 = ?`;
          countParams.push(fileMd5);
        }
        
        if (imgUrl) {
          countSql += ` AND imgUrl = ?`;
          countParams.push(imgUrl);
        }
        
        const countResult = await MySQLHelper.query(countSql, countParams);
        total = countResult[0].count;
      } else if (modelName) {
        data = await DatabaseService.getImagesByModel(modelName, limitNum, offset);
        const stats = await DatabaseService.getImageCountByModel();
        const modelStat = stats.find(stat => stat.modelName === modelName);
        total = modelStat ? modelStat.count : 0;
      }
    } else {
      // 分页查询
      data = await DatabaseService.getImageHistory(limitNum, offset);
      const stats = await DatabaseService.getStatistics();
      total = stats.total_images;
    }

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

/**
 * 根据ID获取单条历史记录
 * GET /api/history/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await DatabaseService.getImageById(id);
    
    if (!record) {
      return res.status(404).json({ error: '未找到记录' });
    }

    res.json(record);
  } catch (error) {
    console.error('获取记录失败:', error);
    res.status(500).json({ 
      error: '获取记录失败',
      message: error.message 
    });
  }
});

/**
 * 通过fileMd5删除记录
 * DELETE /api/history/:fileMd5
 */
router.delete('/:fileMd5', async (req, res) => {
  try {
    const { fileMd5 } = req.params;
    
    const deletedCount = await DatabaseService.deleteImageByMd5(fileMd5);

    if (deletedCount === 0) {
      return res.status(404).json({
        error: '记录不存在',
        message: `没有找到fileMd5为${fileMd5}的记录`
      });
    }

    res.json({
      message: '删除成功',
      deletedCount,
      fileMd5
    });

  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ 
      error: '删除历史记录失败',
      message: error.message 
    });
  }
});

/**
 * 获取所有模型名称列表
 * GET /api/history/models
 */
router.get('/models', async (req, res) => {
  try {
    const modelNames = await DatabaseService.getAllModelNames();
    res.json(modelNames);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({ 
      error: '获取模型列表失败',
      message: error.message 
    });
  }
});

module.exports = router;