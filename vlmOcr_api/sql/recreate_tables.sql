-- MySQL数据库重建脚本 (兼容MySQL 5.5)
-- 根据DATABASE_MIGRATION.md文档创建所有必要的表

-- 使用正确的数据库
USE myocr;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS model_keywords;
DROP TABLE IF EXISTS img_history;
DROP TABLE IF EXISTS models;
DROP TABLE IF EXISTS users;

-- 创建图像历史记录表 (MySQL 5.5兼容版本)
CREATE TABLE img_history (
    id VARCHAR(255) PRIMARY KEY,
    imgUrl VARCHAR(500),
    imgSrc VARCHAR(500),
    fileMd5 VARCHAR(32),
    ocrText TEXT,
    modelName VARCHAR(100),
    allModel TEXT,
    ocrInfo TEXT,
    user_id INT(11) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- 创建模型管理表 (MySQL 5.5兼容版本)
CREATE TABLE models (
    id VARCHAR(255) PRIMARY KEY,
    modelName VARCHAR(100) NOT NULL,
    description TEXT,
    glmTips TEXT,
    moreApi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- 创建模型关键词关系表 (MySQL 5.5兼容版本)
CREATE TABLE model_keywords (
    id INT(11) NOT NULL AUTO_INCREMENT,
    model_id VARCHAR(255) NOT NULL,
    keyword_text VARCHAR(255) NOT NULL,
    keyword_index INT(11),
    PRIMARY KEY (id),
    KEY fk_model_id (model_id),
    CONSTRAINT fk_model_keywords_model FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- 为常用查询字段添加索引
CREATE INDEX idx_img_history_fileMd5 ON img_history(fileMd5);
CREATE INDEX idx_img_history_created_at ON img_history(created_at);
CREATE INDEX idx_img_history_user_id ON img_history(user_id);
CREATE INDEX idx_model_keywords_keyword_text ON model_keywords(keyword_text);

-- 插入默认模型数据（可选）
INSERT INTO models (id, modelName, description, glmTips, moreApi) VALUES
('default-1', '通用OCR模型', '适用于通用文档的OCR识别', '请识别图片中的文字内容', '{"type": "ocr"}'),
('default-2', '表格识别模型', '专门用于识别表格结构', '请识别图片中的表格内容，包括行列结构', '{"type": "table"}');

-- 创建用户表 (MySQL 5.5兼容版本)
CREATE TABLE users (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- 插入默认关键词数据（可选）
INSERT INTO model_keywords (model_id, keyword_text, keyword_index) VALUES
('default-1', '文字识别', 1),
('default-1', 'OCR', 2),
('default-2', '表格', 1),
('default-2', 'Excel', 2);

-- 插入默认管理员用户（可选）
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2b$10$X6KaDTDeewaTmkczXeGps.bTT9mQHSKgvXjFjxvO/9I/3Y4kTzFve', 'admin@example.com', 'admin');
