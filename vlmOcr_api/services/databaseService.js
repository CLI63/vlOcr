const { MySQLHelper, safeLimit } = require('../utils/mysql');

function safeOffset(offset) {
  const parsed = Number.parseInt(offset, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function historyScope(actor, params = []) {
  if (actor && actor.role === 'admin') {
    return { clause: '1=1', params };
  }
  if (actor && actor.userId) {
    return { clause: 'user_id = ?', params: [...params, actor.userId] };
  }
  return { clause: 'user_id IS NULL', params };
}

function withHistoryScope(actor, prefixParams = []) {
  return historyScope(actor, prefixParams);
}

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJsonText(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback === undefined ? null : JSON.stringify(fallback);
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function normalizeHistoryRecord(record) {
  if (!record) return record;
  return {
    ...record,
    allModel: safeJsonParse(record.allModel, []),
    ocrInfo: safeJsonParse(record.ocrInfo, {}),
    structuredJson: safeJsonParse(record.structured_json, {}),
    correctedJson: safeJsonParse(record.corrected_json, {}),
    rawResponse: safeJsonParse(record.raw_response, null),
    fileId: record.file_id || record.fileId || null,
    taskId: record.task_id || record.taskId || null,
    sourceType: record.source_type || record.sourceType || '',
  };
}

function uploadedFileScope(actor, params = []) {
  if (actor && actor.role === 'admin') {
    return { clause: '1=1', params };
  }
  if (actor && actor.userId) {
    return { clause: 'owner_user_id = ?', params: [...params, actor.userId] };
  }
  return { clause: 'owner_user_id IS NULL', params };
}

class DatabaseService {
  static async getVisionModelProviders(options = {}) {
    const includeDisabled = options.includeDisabled === true;
    let sql = 'SELECT * FROM vision_model_providers';
    const params = [];

    if (!includeDisabled) {
      sql += ' WHERE enabled = ?';
      params.push(1);
    }

    sql += ' ORDER BY sortOrder ASC, created_at ASC';
    return await MySQLHelper.query(sql, params);
  }

  static async getVisionModelProviderById(id) {
    return await MySQLHelper.findOne('vision_model_providers', { id });
  }

  static async getVisionModelProviderByValue(value) {
    return await MySQLHelper.findOne('vision_model_providers', { value });
  }

  static async saveVisionModelProvider(data) {
    return await MySQLHelper.insert('vision_model_providers', {
      id: data.id,
      label: data.label,
      value: data.value,
      providerType: data.providerType,
      description: data.description || '',
      enabled: data.enabled ? 1 : 0,
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    });
  }

  static async updateVisionModelProvider(id, data) {
    return await MySQLHelper.update('vision_model_providers', {
      label: data.label,
      value: data.value,
      providerType: data.providerType,
      description: data.description || '',
      enabled: data.enabled ? 1 : 0,
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    }, { id });
  }

  static async deleteVisionModelProvider(id) {
    return await MySQLHelper.delete('vision_model_providers', { id });
  }

  static async countModelsByMoreApi(moreApi) {
    const result = await MySQLHelper.query(
      'SELECT COUNT(*) as count FROM models WHERE moreApi = ?',
      [moreApi]
    );
    return result[0]?.count || 0;
  }

  static async getImageHistory(limit = 50, offset = 0, actor = null, filters = {}) {
    const safePageSize = safeLimit(limit, 50, 100);
    const safePageOffset = safeOffset(offset);
    const conditions = [];
    const params = [];
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    const scope = withHistoryScope(actor, params);
    conditions.push(scope.clause);
    const sql = `
      SELECT * FROM img_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ${safePageSize} OFFSET ${safePageOffset}
    `;
    const rows = await MySQLHelper.query(sql, scope.params);
    return rows.map(normalizeHistoryRecord);
  }

  static async getImageById(id, actor = null) {
    const scope = withHistoryScope(actor, [id]);
    const sql = `SELECT * FROM img_history WHERE id = ? AND ${scope.clause} LIMIT 1`;
    const results = await MySQLHelper.query(sql, scope.params);
    return normalizeHistoryRecord(results[0] || null);
  }

  static async getImageDetailById(id, actor = null) {
    const record = await this.getImageById(id, actor);
    if (!record) return null;
    const [correction, template] = await Promise.all([
      this.getCorrectionByHistoryId(id),
      record.modelName ? this.getTemplateByModelName(record.modelName) : null,
    ]);
    return {
      ...record,
      correction,
      template,
    };
  }

  static async getImagesByModel(modelName, limit = 50, offset = 0, actor = null, filters = {}) {
    const safePageSize = safeLimit(limit, 50, 100);
    const safePageOffset = safeOffset(offset);
    const conditions = ['modelName = ?'];
    const params = [modelName];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const scope = withHistoryScope(actor, params);
    conditions.push(scope.clause);
    const sql = `
      SELECT * FROM img_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ${safePageSize} OFFSET ${safePageOffset}
    `;
    const rows = await MySQLHelper.query(sql, scope.params);
    return rows.map(normalizeHistoryRecord);
  }

  static async saveImageHistory(data) {
    const record = {
      id: data.id,
      imgUrl: data.imgUrl,
      imgSrc: data.imgSrc,
      fileMd5: data.fileMd5,
      ocrText: data.ocrText,
      modelName: data.modelName,
      allModel: toJsonText(data.allModel, []),
      ocrInfo: toJsonText(data.ocrInfo, {}),
      status: data.status || 'success',
      structured_json: toJsonText(data.structuredJson || data.ocrInfo, {}),
      corrected_json: toJsonText(data.correctedJson, {}),
      raw_response: toJsonText(data.rawResponse, null),
      task_id: data.taskId || null,
      source_type: data.sourceType || null,
      user_id: data.userId || null,
      file_id: data.fileId || null,
    };
    return await MySQLHelper.insert('img_history', record);
  }

  static async updateImageHistory(id, data) {
    return await MySQLHelper.update('img_history', data, { id });
  }

  static async deleteImageHistory(id, actor = null) {
    const record = await this.getImageById(id, actor);
    if (!record) return 0;
    const scope = withHistoryScope(actor, [id]);
    const sql = `DELETE FROM img_history WHERE id = ? AND ${scope.clause}`;
    const result = await MySQLHelper.query(sql, scope.params);
    return result.affectedRows;
  }

  static async deleteImageByMd5(fileMd5, actor = null) {
    const scope = withHistoryScope(actor, [fileMd5]);
    const sql = `DELETE FROM img_history WHERE fileMd5 = ? AND ${scope.clause}`;
    const result = await MySQLHelper.query(sql, scope.params);
    return result.affectedRows;
  }

  static async getImageCountByModel(actor = null) {
    const scope = withHistoryScope(actor);
    const sql = `
      SELECT modelName, COUNT(*) as count
      FROM img_history
      WHERE ${scope.clause}
      GROUP BY modelName
      ORDER BY count DESC
    `;
    return await MySQLHelper.query(sql, scope.params);
  }

  static async getAllModels() {
    const models = await MySQLHelper.findAll('models', {}, 'id ASC');
    for (const model of models) {
      const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
      model.keyWords = keywords.map((kw) => ({
        text: kw.keyword_text,
        index: kw.keyword_index,
      }));
      model.templateId = model.template_id || null;
    }
    return models;
  }

  static async getModelById(id) {
    const model = await MySQLHelper.findOne('models', { id });
    if (model) {
      const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
      model.keyWords = keywords.map((kw) => ({
        text: kw.keyword_text,
        index: kw.keyword_index,
      }));
      model.templateId = model.template_id || null;
    }
    return model;
  }

  static async getModelByName(modelName) {
    const model = await MySQLHelper.findOne('models', { modelName });
    if (model) {
      const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
      model.keyWords = keywords.map((kw) => ({
        text: kw.keyword_text,
        index: kw.keyword_index,
      }));
      model.templateId = model.template_id || null;
    }
    return model;
  }

  static async assertEnabledVisionProvider(moreApi) {
    const provider = await this.getVisionModelProviderByValue(moreApi);
    if (!provider) {
      throw new Error('所选视觉模型接口不存在');
    }
    if (!provider.enabled) {
      throw new Error('所选视觉模型接口已停用');
    }
    return provider;
  }

  static async saveModel(data) {
    await this.assertEnabledVisionProvider(data.moreApi);

    const modelRecord = {
      id: data.id,
      modelName: data.modelName,
      description: data.description,
      glmTips: data.glmTips,
      moreApi: data.moreApi,
      template_id: data.templateId || null,
    };

    const result = await MySQLHelper.insert('models', modelRecord);

    if (data.keyWords && Array.isArray(data.keyWords)) {
      const keywords = data.keyWords.map((keyword) => ({
        model_id: data.id,
        keyword_text: keyword.text,
        keyword_index: keyword.index,
      }));
      if (keywords.length > 0) {
        await MySQLHelper.batchInsert('model_keywords', keywords);
      }
    }

    return result;
  }

  static async updateModel(id, data) {
    await this.assertEnabledVisionProvider(data.moreApi);

    const modelData = {
      modelName: data.modelName,
      description: data.description,
      glmTips: data.glmTips,
      moreApi: data.moreApi,
      template_id: data.templateId || null,
    };

    await MySQLHelper.update('models', modelData, { id });

    if (data.keyWords && Array.isArray(data.keyWords)) {
      await MySQLHelper.delete('model_keywords', { model_id: id });
      const keywords = data.keyWords.map((keyword) => ({
        model_id: id,
        keyword_text: keyword.text,
        keyword_index: keyword.index,
      }));
      if (keywords.length > 0) {
        await MySQLHelper.batchInsert('model_keywords', keywords);
      }
    }

    return true;
  }

  static async deleteModel(id) {
    return await MySQLHelper.delete('models', { id });
  }

  static async searchModels(keyword) {
    const pattern = `%${keyword}%`;
    const sql = `
      SELECT DISTINCT m.*
      FROM models m
      LEFT JOIN model_keywords mk ON mk.model_id = m.id
      WHERE m.modelName LIKE ? OR m.description LIKE ? OR mk.keyword_text LIKE ?
      ORDER BY m.id ASC
      LIMIT 100
    `;
    const models = await MySQLHelper.query(sql, [pattern, pattern, pattern]);
    for (const model of models) {
      const keywords = await MySQLHelper.findAll('model_keywords', { model_id: model.id });
      model.keyWords = keywords.map((kw) => ({
        text: kw.keyword_text,
        index: kw.keyword_index,
      }));
    }
    return models;
  }

  static async searchImages(searchTerm, limit = 50, offset = 0, actor = null) {
    const safePageSize = safeLimit(limit, 50, 100);
    const safePageOffset = safeOffset(offset);
    const searchPattern = `%${searchTerm}%`;
    const scope = withHistoryScope(actor, [searchPattern, searchPattern]);
    const sql = `
      SELECT * FROM img_history
      WHERE (ocrText LIKE ? OR modelName LIKE ?) AND ${scope.clause}
      ORDER BY created_at DESC
      LIMIT ${safePageSize} OFFSET ${safePageOffset}
    `;
    const rows = await MySQLHelper.query(sql, scope.params);
    return rows.map(normalizeHistoryRecord);
  }

  static async countSearchImages(searchTerm, actor = null) {
    const searchPattern = `%${searchTerm}%`;
    const scope = withHistoryScope(actor, [searchPattern, searchPattern]);
    const sql = `
      SELECT COUNT(*) as count FROM img_history
      WHERE (ocrText LIKE ? OR modelName LIKE ?) AND ${scope.clause}
    `;
    const result = await MySQLHelper.query(sql, scope.params);
    return result[0]?.count || 0;
  }

  static async searchImagesByFile(fileMd5 = null, imageUrl = null, limit = 10, offset = 0, actor = null, filters = {}) {
    const safePageSize = safeLimit(limit, 10, 100);
    const safePageOffset = safeOffset(offset);
    const conditions = [];
    const params = [];

    if (fileMd5) {
      conditions.push('fileMd5 = ?');
      params.push(fileMd5);
    }

    if (imageUrl) {
      conditions.push('imgUrl LIKE ?');
      params.push(`%${imageUrl}%`);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const scope = withHistoryScope(actor, params);
    conditions.push(scope.clause);

    const sql = `
      SELECT * FROM img_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ${safePageSize} OFFSET ${safePageOffset}
    `;
    const rows = await MySQLHelper.query(sql, scope.params);
    return rows.map(normalizeHistoryRecord);
  }

  static async countImages(filters = {}, actor = null) {
    const conditions = [];
    const params = [];

    if (filters.fileMd5) {
      conditions.push('fileMd5 = ?');
      params.push(filters.fileMd5);
    }

    if (filters.imgUrl) {
      conditions.push('imgUrl LIKE ?');
      params.push(`%${filters.imgUrl}%`);
    }

    if (filters.modelName) {
      conditions.push('modelName = ?');
      params.push(filters.modelName);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const scope = withHistoryScope(actor, params);
    conditions.push(scope.clause);

    const sql = `SELECT COUNT(*) as count FROM img_history WHERE ${conditions.join(' AND ')}`;
    const result = await MySQLHelper.query(sql, scope.params);
    return result[0]?.count || 0;
  }

  static async saveUploadedFile(data) {
    const record = {
      id: data.id,
      stored_filename: data.storedFilename,
      original_name: data.originalName,
      mime_type: data.mimeType,
      size: data.size,
      sha256: data.sha256,
      owner_user_id: data.ownerUserId || null,
      status: data.status || 'active',
    };
    await MySQLHelper.insert('uploaded_files', record);
    return this.getUploadedFileById(data.id, { role: 'admin' });
  }

  static async getUploadedFileById(id, actor = null) {
    const scope = uploadedFileScope(actor, [id]);
    const sql = `SELECT * FROM uploaded_files WHERE id = ? AND status != 'deleted' AND ${scope.clause} LIMIT 1`;
    const rows = await MySQLHelper.query(sql, scope.params);
    return rows[0] || null;
  }

  static async listUploadedFiles(actor = null, limit = 100, offset = 0) {
    const safePageSize = safeLimit(limit, 100, 100);
    const safePageOffset = safeOffset(offset);
    const scope = uploadedFileScope(actor);
    const sql = `
      SELECT * FROM uploaded_files
      WHERE status != 'deleted' AND ${scope.clause}
      ORDER BY created_at DESC
      LIMIT ${safePageSize} OFFSET ${safePageOffset}
    `;
    return await MySQLHelper.query(sql, scope.params);
  }

  static async markUploadedFileDeleted(id, actor = null) {
    const file = await this.getUploadedFileById(id, actor);
    if (!file) return null;
    await MySQLHelper.update('uploaded_files', { status: 'deleted' }, { id });
    return file;
  }

  static async createOcrTask(data) {
    return await MySQLHelper.insert('ocr_tasks', {
      id: data.id,
      name: data.name,
      status: data.status || 'pending',
      total_count: data.totalCount || 0,
      success_count: data.successCount || 0,
      failed_count: data.failedCount || 0,
      created_by: data.createdBy || null,
    });
  }

  static async createOcrTaskItem(data) {
    return await MySQLHelper.insert('ocr_task_items', {
      id: data.id,
      task_id: data.taskId,
      file_id: data.fileId || null,
      page_no: data.pageNo || null,
      model_id: data.modelId || null,
      status: data.status || 'pending',
      error_message: data.errorMessage || null,
      history_id: data.historyId || null,
    });
  }

  static async getTaskById(id, actor = null) {
    const params = [id];
    let scope = 'id = ?';
    if (actor && actor.role !== 'admin') {
      scope += ' AND created_by = ?';
      params.push(actor.userId);
    }
    const rows = await MySQLHelper.query(`SELECT * FROM ocr_tasks WHERE ${scope} LIMIT 1`, params);
    return rows[0] || null;
  }

  static async listTasks(actor = null, limit = 50, offset = 0) {
    const safePageSize = safeLimit(limit, 50, 100);
    const safePageOffset = safeOffset(offset);
    const params = [];
    let where = '1=1';
    if (actor && actor.role !== 'admin') {
      where = 'created_by = ?';
      params.push(actor.userId);
    }
    return await MySQLHelper.query(
      `SELECT * FROM ocr_tasks WHERE ${where} ORDER BY created_at DESC LIMIT ${safePageSize} OFFSET ${safePageOffset}`,
      params
    );
  }

  static async countTasks(actor = null) {
    const params = [];
    let where = '1=1';
    if (actor && actor.role !== 'admin') {
      where = 'created_by = ?';
      params.push(actor.userId);
    }
    const rows = await MySQLHelper.query(`SELECT COUNT(*) as count FROM ocr_tasks WHERE ${where}`, params);
    return rows[0]?.count || 0;
  }

  static async getTaskItems(taskId) {
    return await MySQLHelper.query(
      'SELECT * FROM ocr_task_items WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );
  }

  static async updateTask(id, data) {
    return await MySQLHelper.update('ocr_tasks', data, { id });
  }

  static async updateTaskItem(id, data) {
    return await MySQLHelper.update('ocr_task_items', data, { id });
  }

  static async getPendingTaskItems(limit = 10) {
    const safePageSize = safeLimit(limit, 10, 50);
    return await MySQLHelper.query(
      `SELECT * FROM ocr_task_items WHERE status IN ('pending', 'retry') ORDER BY created_at ASC LIMIT ${safePageSize}`
    );
  }

  static async recountTask(taskId) {
    const [summary] = await MySQLHelper.query(
      `
        SELECT
          COUNT(*) as total_count,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM ocr_task_items
        WHERE task_id = ?
      `,
      [taskId]
    );

    const totalCount = Number(summary?.total_count || 0);
    const successCount = Number(summary?.success_count || 0);
    const failedCount = Number(summary?.failed_count || 0);
    let status = 'processing';

    if (totalCount === 0) {
      status = 'pending';
    } else if (successCount + failedCount === totalCount) {
      status = failedCount > 0 ? 'partial_failed' : 'success';
    }

    await this.updateTask(taskId, {
      total_count: totalCount,
      success_count: successCount,
      failed_count: failedCount,
      status,
    });
    return { totalCount, successCount, failedCount, status };
  }

  static async saveTemplate(data) {
    return await MySQLHelper.insert('ocr_templates', {
      id: data.id,
      name: data.name,
      description: data.description || '',
      version: data.version || 1,
      schema_json: toJsonText(data.schemaJson, []),
      created_by: data.createdBy || null,
    });
  }

  static async updateTemplate(id, data) {
    return await MySQLHelper.update('ocr_templates', {
      name: data.name,
      description: data.description || '',
      version: data.version || 1,
      schema_json: toJsonText(data.schemaJson, []),
    }, { id });
  }

  static async deleteTemplate(id) {
    return await MySQLHelper.delete('ocr_templates', { id });
  }

  static async listTemplates() {
    const rows = await MySQLHelper.query('SELECT * FROM ocr_templates ORDER BY created_at DESC');
    return rows.map((row) => ({
      ...row,
      schemaJson: safeJsonParse(row.schema_json, []),
    }));
  }

  static async getTemplateById(id) {
    const row = await MySQLHelper.findOne('ocr_templates', { id });
    if (!row) return null;
    return {
      ...row,
      schemaJson: safeJsonParse(row.schema_json, []),
    };
  }

  static async getTemplateByModelName(modelName) {
    const model = await this.getModelByName(modelName);
    if (!model?.templateId) return null;
    return await this.getTemplateById(model.templateId);
  }

  static async countModelsByTemplateId(templateId) {
    const rows = await MySQLHelper.query(
      'SELECT COUNT(*) as count FROM models WHERE template_id = ?',
      [templateId]
    );
    return rows[0]?.count || 0;
  }

  static async saveCorrection(data) {
    return await MySQLHelper.insert('ocr_corrections', {
      id: data.id,
      history_id: data.historyId,
      original_json: toJsonText(data.originalJson, {}),
      corrected_json: toJsonText(data.correctedJson, {}),
      status: data.status || 'draft',
      corrected_by: data.correctedBy || null,
      corrected_at: data.correctedAt || null,
    });
  }

  static async updateCorrection(id, data) {
    return await MySQLHelper.update('ocr_corrections', {
      original_json: toJsonText(data.originalJson, {}),
      corrected_json: toJsonText(data.correctedJson, {}),
      status: data.status || 'draft',
      corrected_by: data.correctedBy || null,
      corrected_at: data.correctedAt || null,
    }, { id });
  }

  static async getCorrectionByHistoryId(historyId) {
    const row = await MySQLHelper.findOne('ocr_corrections', { history_id: historyId });
    if (!row) return null;
    return {
      ...row,
      originalJson: safeJsonParse(row.original_json, {}),
      correctedJson: safeJsonParse(row.corrected_json, {}),
    };
  }

  static async getCorrectionById(id) {
    const row = await MySQLHelper.findOne('ocr_corrections', { id });
    if (!row) return null;
    return {
      ...row,
      originalJson: safeJsonParse(row.original_json, {}),
      correctedJson: safeJsonParse(row.corrected_json, {}),
    };
  }

  static async saveModelVersion(data) {
    return await MySQLHelper.insert('model_versions', {
      id: data.id,
      model_id: data.modelId,
      version: data.version,
      snapshot_json: toJsonText(data.snapshotJson, {}),
      change_note: data.changeNote || null,
      created_by: data.createdBy || null,
    });
  }

  static async listModelVersions(modelId) {
    const rows = await MySQLHelper.query(
      'SELECT * FROM model_versions WHERE model_id = ? ORDER BY version DESC, created_at DESC',
      [modelId]
    );
    return rows.map((row) => ({
      ...row,
      snapshotJson: safeJsonParse(row.snapshot_json, {}),
    }));
  }

  static async getNextModelVersion(modelId) {
    const rows = await MySQLHelper.query(
      'SELECT COALESCE(MAX(version), 0) as max_version FROM model_versions WHERE model_id = ?',
      [modelId]
    );
    return Number(rows[0]?.max_version || 0) + 1;
  }

  static async getStatistics(actor = null) {
    const scope = withHistoryScope(actor);
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM img_history WHERE ${scope.clause}) as total_images,
        (SELECT COUNT(*) FROM models) as total_models,
        (SELECT COUNT(DISTINCT modelName) FROM img_history WHERE ${scope.clause}) as active_models
    `;
    const params = [...scope.params, ...scope.params];
    const result = await MySQLHelper.query(sql, params);
    return result[0];
  }

  static async getAllModelNames(actor = null) {
    const scope = withHistoryScope(actor);
    const sql = `
      SELECT DISTINCT modelName
      FROM img_history
      WHERE modelName IS NOT NULL AND modelName != '' AND ${scope.clause}
      ORDER BY modelName
    `;
    const results = await MySQLHelper.query(sql, scope.params);
    return results.map((row) => row.modelName);
  }
}

module.exports = DatabaseService;
