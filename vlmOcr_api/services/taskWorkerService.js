const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('./databaseService');
const { callPaddleOCR } = require('../ocrApi/PaddleOcrVl');
const { getUploadPathByStoredFilename } = require('../utils/fileSecurity');

let timer = null;
let running = false;

function mapTemplateResult(template, payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  if (!template?.schemaJson?.length) {
    return source;
  }

  const mapped = {};
  template.schemaJson.forEach((field) => {
    mapped[field.key] = source[field.key] ?? field.defaultValue ?? '';
  });
  return mapped;
}

async function processTaskItem(item) {
  const task = await DatabaseService.getTaskById(item.task_id, { role: 'admin' });
  if (!task || task.status === 'cancelled') {
    return;
  }

  const file = await DatabaseService.getUploadedFileById(item.file_id, { role: 'admin' });
  if (!file) {
    await DatabaseService.updateTaskItem(item.id, {
      status: 'failed',
      error_message: '任务文件不存在',
    });
    await DatabaseService.recountTask(item.task_id);
    return;
  }

  await DatabaseService.updateTask(item.task_id, { status: 'processing' });
  await DatabaseService.updateTaskItem(item.id, {
    status: 'processing',
    error_message: null,
    started_at: new Date(),
  });

  try {
    const localFilePath = getUploadPathByStoredFilename(file.stored_filename);
    const response = await callPaddleOCR(localFilePath, '', {
      allowLocalFile: true,
    });

    const model = item.model_id ? await DatabaseService.getModelById(item.model_id) : null;
    const template = model?.templateId ? await DatabaseService.getTemplateById(model.templateId) : null;
    const structuredJson = response.json || {};
    const mappedJson = mapTemplateResult(template, structuredJson);
    const historyId = uuidv4();

    await DatabaseService.saveImageHistory({
      id: historyId,
      imgUrl: `/api/upload/files/${file.id}`,
      imgSrc: response.outputDir || '',
      fileMd5: '',
      ocrText: response.rawText || '',
      ocrInfo: structuredJson,
      structuredJson: mappedJson,
      rawResponse: response.jsonlItems || response.json || {},
      modelName: model?.modelName || response.model || '',
      allModel: [{ modelName: model?.modelName || response.model || '', score: 1 }],
      fileId: file.id,
      taskId: item.task_id,
      sourceType: file.mime_type === 'application/pdf' ? 'pdf' : 'image',
      userId: task.created_by || null,
      status: 'success',
    });

    await DatabaseService.updateTaskItem(item.id, {
      status: 'success',
      history_id: historyId,
      finished_at: new Date(),
    });
  } catch (error) {
    await DatabaseService.updateTaskItem(item.id, {
      status: 'failed',
      error_message: error.message || '任务执行失败',
      finished_at: new Date(),
    });
  }

  await DatabaseService.recountTask(item.task_id);
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const items = await DatabaseService.getPendingTaskItems(5);
    for (const item of items) {
      await processTaskItem(item);
    }
  } finally {
    running = false;
  }
}

function startTaskWorker() {
  if (timer) return;
  timer = setInterval(() => {
    tick().catch((error) => {
      console.error('Task worker tick failed:', error.message);
    });
  }, 5000);
}

module.exports = {
  startTaskWorker,
  tick,
};
