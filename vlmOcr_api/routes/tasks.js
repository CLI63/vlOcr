const express = require('express');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('../services/databaseService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { fileIds = [], modelId = '', autoClassify = true, pdfPageMode = 'all' } = req.body || {};
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ success: false, message: '请至少选择一个文件' });
    }

    const validFiles = [];
    const skippedFileIds = [];
    for (const fileId of fileIds) {
      const file = await DatabaseService.getUploadedFileById(fileId, req.user);
      if (file) {
        validFiles.push(file);
      } else {
        skippedFileIds.push(fileId);
      }
    }

    if (validFiles.length === 0) {
      return res.status(400).json({ success: false, message: '没有可创建任务的有效文件' });
    }

    const taskId = uuidv4();
    await DatabaseService.createOcrTask({
      id: taskId,
      name: `批量识别任务 ${new Date().toLocaleString('zh-CN')}`,
      status: 'pending',
      totalCount: validFiles.length,
      createdBy: req.user.userId,
    });

    for (const file of validFiles) {
      await DatabaseService.createOcrTaskItem({
        id: uuidv4(),
        taskId,
        fileId: file.id,
        modelId: modelId || null,
        pageNo: pdfPageMode === 'all' && file.mime_type === 'application/pdf' ? 1 : null,
        status: 'pending',
      });
    }

    const task = await DatabaseService.getTaskById(taskId, req.user);
    const items = await DatabaseService.getTaskItems(taskId);
    const payload = {
      ...task,
      items,
      autoClassify,
    };
    if (skippedFileIds.length > 0) {
      payload.skippedFileIds = skippedFileIds;
    }
    res.json({ success: true, data: payload, message: '任务创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '任务创建失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      DatabaseService.listTasks(req.user, limit, offset),
      DatabaseService.countTasks(req.user),
    ]);
    res.json({
      success: true,
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '获取任务列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await DatabaseService.getTaskById(req.params.id, req.user);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    const items = await DatabaseService.getTaskItems(req.params.id);
    res.json({ success: true, data: { ...task, items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '获取任务详情失败' });
  }
});

router.post('/:id/retry', async (req, res) => {
  try {
    const task = await DatabaseService.getTaskById(req.params.id, req.user);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const items = await DatabaseService.getTaskItems(req.params.id);
    const failedItems = items.filter((item) => item.status === 'failed');
    for (const item of failedItems) {
      await DatabaseService.updateTaskItem(item.id, {
        status: 'retry',
        error_message: null,
        started_at: null,
        finished_at: null,
      });
    }
    await DatabaseService.updateTask(req.params.id, { status: 'pending' });
    res.json({ success: true, message: '失败项已加入重试队列' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '重试失败项失败' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const task = await DatabaseService.getTaskById(req.params.id, req.user);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    await DatabaseService.updateTask(req.params.id, { status: 'cancelled' });
    const items = await DatabaseService.getTaskItems(req.params.id);
    for (const item of items) {
      if (['pending', 'retry', 'processing'].includes(item.status)) {
        await DatabaseService.updateTaskItem(item.id, {
          status: 'cancelled',
          error_message: item.error_message || '任务已取消',
          finished_at: new Date(),
        });
      }
    }
    res.json({ success: true, message: '任务已取消' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || '取消任务失败' });
  }
});

module.exports = router;
