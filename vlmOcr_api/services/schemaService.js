const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('../config/appConfig');

async function createServerConnection() {
  return mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    port: config.db.port,
    charset: 'utf8mb4',
    multipleStatements: false,
  });
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [config.db.database, tableName, columnName]
  );
  return rows[0].count > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [rows] = await connection.execute(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
    `,
    [config.db.database, tableName, indexName]
  );
  return rows[0].count > 0;
}

async function tableHasRows(connection, tableName) {
  const [rows] = await connection.execute(`SELECT 1 FROM ${tableName} LIMIT 1`);
  return rows.length > 0;
}

async function addColumnIfMissing(connection, tableName, columnName, definition) {
  if (!await columnExists(connection, tableName, columnName)) {
    await connection.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function addIndexIfMissing(connection, tableName, indexName, definition) {
  if (!await indexExists(connection, tableName, indexName)) {
    await connection.execute(`CREATE INDEX ${indexName} ON ${tableName} ${definition}`);
  }
}

async function ensureDefaultAdmin(connection) {
  if (await tableHasRows(connection, 'users')) {
    return;
  }

  const [rows] = await connection.execute('SELECT id FROM users WHERE username = ? LIMIT 1', ['admin']);
  if (rows.length > 0) {
    await connection.execute('UPDATE users SET role = ? WHERE username = ?', ['admin', 'admin']);
    return;
  }

  const password = process.env.DEFAULT_ADMIN_PASSWORD || '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  await connection.execute(
    'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
    ['admin', hashedPassword, 'admin@example.com', 'admin']
  );
}

async function ensureDefaultVisionProviders(connection) {
  if (await tableHasRows(connection, 'vision_model_providers')) {
    return;
  }

  await connection.execute(
    `
      INSERT INTO vision_model_providers (id, label, value, providerType, description, enabled, sortOrder)
      VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        value = VALUES(value),
        providerType = VALUES(providerType),
        description = VALUES(description),
        enabled = VALUES(enabled),
        sortOrder = VALUES(sortOrder)
    `,
    [
      'provider-glm-4-6v-flash',
      'GLM-4.6V-Flash',
      'GLM-4.6V-Flash',
      'glm',
      '智谱第三方视觉模型',
      1,
      1,
      'provider-paddleocr-vl-1-6',
      'PaddleOCR-VL-1.6',
      'PaddleOCR-VL-1.6',
      'paddle',
      'PaddleOCR 第三方视觉模型',
      1,
      2,
    ]
  );
}

async function migrateLegacyMoreApi(connection) {
  await connection.execute(
    `
      UPDATE models
      SET moreApi = CASE
        WHEN moreApi = 'GLM-4.1V-Thinking-Flash' THEN 'GLM-4.6V-Flash'
        WHEN moreApi = 'Ollama-Qwen2.5VL' THEN 'GLM-4.6V-Flash'
        WHEN moreApi = 'PaddleOCR-VL' THEN 'PaddleOCR-VL-1.6'
        ELSE moreApi
      END
      WHERE moreApi IN ('GLM-4.1V-Thinking-Flash', 'Ollama-Qwen2.5VL', 'PaddleOCR-VL')
    `
  );
}

async function removeLegacyDefaultModels(connection) {
  await connection.execute(
    `DELETE FROM models WHERE id = ?`,
    ['default-ollama-vl']
  );
}

async function ensureDefaultModels(connection) {
  if (await tableHasRows(connection, 'models')) {
    return;
  }

  await connection.execute(
    `
      INSERT IGNORE INTO models (id, modelName, description, glmTips, moreApi)
      VALUES
      ('default-1', '通用OCR模型', '适用于通用文档的OCR识别', '请识别图片中的文字内容', 'GLM-4.6V-Flash'),
      ('default-2', '表格识别模型', '专门用于识别表格结构', '请识别图片中的表格内容，包括行列结构', 'PaddleOCR-VL-1.6')
    `
  );

  await connection.execute(
    `
      INSERT IGNORE INTO model_keywords (model_id, keyword_text, keyword_index)
      VALUES
      ('default-1', '文字识别', 1),
      ('default-1', 'OCR', 2),
      ('default-2', '表格', 1),
      ('default-2', 'Excel', 2)
    `
  );
}

async function initializeSchema() {
  let connection;
  try {
    connection = await createServerConnection();
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${config.db.database}\``);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_username (username),
        UNIQUE KEY uk_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS models (
        id VARCHAR(255) PRIMARY KEY,
        modelName VARCHAR(100) NOT NULL,
        description TEXT,
        glmTips TEXT,
        moreApi TEXT,
        template_id VARCHAR(64) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vision_model_providers (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        value VARCHAR(100) NOT NULL,
        providerType VARCHAR(20) NOT NULL,
        description TEXT,
        enabled TINYINT(1) NOT NULL DEFAULT 1,
        sortOrder INT(11) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY uk_vision_model_providers_value (value)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS model_keywords (
        id INT(11) NOT NULL AUTO_INCREMENT,
        model_id VARCHAR(255) NOT NULL,
        keyword_text VARCHAR(255) NOT NULL,
        keyword_index INT(11),
        PRIMARY KEY (id),
        UNIQUE KEY uk_model_keyword (model_id, keyword_text),
        KEY fk_model_id (model_id),
        CONSTRAINT fk_model_keywords_model FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS img_history (
        id VARCHAR(255) PRIMARY KEY,
        imgUrl VARCHAR(500),
        imgSrc VARCHAR(500),
        file_id VARCHAR(64) NULL,
        fileMd5 VARCHAR(32),
        ocrText TEXT,
        modelName VARCHAR(100),
        allModel TEXT,
        ocrInfo TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'success',
        structured_json LONGTEXT NULL,
        corrected_json LONGTEXT NULL,
        raw_response LONGTEXT NULL,
        task_id VARCHAR(64) NULL,
        source_type VARCHAR(20) NULL,
        user_id INT(11) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id VARCHAR(64) PRIMARY KEY,
        stored_filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        size BIGINT NOT NULL DEFAULT 0,
        sha256 VARCHAR(64),
        owner_user_id INT(11) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY uk_uploaded_files_stored_filename (stored_filename),
        KEY idx_uploaded_files_owner_user_id (owner_user_id),
        KEY idx_uploaded_files_status (status),
        KEY idx_uploaded_files_sha256 (sha256)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ocr_tasks (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_count INT(11) NOT NULL DEFAULT 0,
        success_count INT(11) NOT NULL DEFAULT 0,
        failed_count INT(11) NOT NULL DEFAULT 0,
        created_by INT(11) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        KEY idx_ocr_tasks_status (status),
        KEY idx_ocr_tasks_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ocr_task_items (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        file_id VARCHAR(64) NULL,
        page_no INT(11) NULL,
        model_id VARCHAR(255) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        history_id VARCHAR(255) NULL,
        started_at TIMESTAMP NULL DEFAULT NULL,
        finished_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        KEY idx_ocr_task_items_task_id (task_id),
        KEY idx_ocr_task_items_status (status),
        KEY idx_ocr_task_items_file_id (file_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ocr_templates (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version INT(11) NOT NULL DEFAULT 1,
        schema_json LONGTEXT NOT NULL,
        created_by INT(11) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        KEY idx_ocr_templates_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ocr_corrections (
        id VARCHAR(64) PRIMARY KEY,
        history_id VARCHAR(255) NOT NULL,
        original_json LONGTEXT NOT NULL,
        corrected_json LONGTEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        corrected_by INT(11) NULL,
        corrected_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        KEY idx_ocr_corrections_history_id (history_id),
        KEY idx_ocr_corrections_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS model_versions (
        id VARCHAR(64) PRIMARY KEY,
        model_id VARCHAR(255) NOT NULL,
        version INT(11) NOT NULL DEFAULT 1,
        snapshot_json LONGTEXT NOT NULL,
        change_note TEXT NULL,
        created_by INT(11) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL,
        KEY idx_model_versions_model_id (model_id),
        KEY idx_model_versions_version (version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await addColumnIfMissing(connection, 'users', 'role', "VARCHAR(20) NOT NULL DEFAULT 'user'");
    await addColumnIfMissing(connection, 'models', 'template_id', 'VARCHAR(64) NULL');
    await addColumnIfMissing(connection, 'img_history', 'user_id', 'INT(11) NULL');
    await addColumnIfMissing(connection, 'img_history', 'file_id', 'VARCHAR(64) NULL');
    await addColumnIfMissing(connection, 'img_history', 'status', "VARCHAR(20) NOT NULL DEFAULT 'success'");
    await addColumnIfMissing(connection, 'img_history', 'structured_json', 'LONGTEXT NULL');
    await addColumnIfMissing(connection, 'img_history', 'corrected_json', 'LONGTEXT NULL');
    await addColumnIfMissing(connection, 'img_history', 'raw_response', 'LONGTEXT NULL');
    await addColumnIfMissing(connection, 'img_history', 'task_id', 'VARCHAR(64) NULL');
    await addColumnIfMissing(connection, 'img_history', 'source_type', 'VARCHAR(20) NULL');
    await addIndexIfMissing(connection, 'img_history', 'idx_img_history_fileMd5', '(fileMd5)');
    await addIndexIfMissing(connection, 'img_history', 'idx_img_history_created_at', '(created_at)');
    await addIndexIfMissing(connection, 'img_history', 'idx_img_history_user_id', '(user_id)');
    await addIndexIfMissing(connection, 'img_history', 'idx_img_history_file_id', '(file_id)');
    await addIndexIfMissing(connection, 'img_history', 'idx_img_history_task_id', '(task_id)');
    await addIndexIfMissing(connection, 'img_history', 'idx_img_history_status', '(status)');
    await addIndexIfMissing(connection, 'model_keywords', 'idx_model_keywords_keyword_text', '(keyword_text)');
    await addIndexIfMissing(connection, 'models', 'idx_models_template_id', '(template_id)');
    await addIndexIfMissing(connection, 'vision_model_providers', 'idx_vision_model_providers_enabled', '(enabled)');
    await addIndexIfMissing(connection, 'vision_model_providers', 'idx_vision_model_providers_sort_order', '(sortOrder)');

    await ensureDefaultAdmin(connection);
    await ensureDefaultVisionProviders(connection);
    await migrateLegacyMoreApi(connection);
    await removeLegacyDefaultModels(connection);
    await ensureDefaultModels(connection);
    console.log('Database schema initialized successfully');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  initializeSchema,
};
