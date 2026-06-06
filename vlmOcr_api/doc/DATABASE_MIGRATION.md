# MySQL数据库迁移指南

## 项目概述
本项目已将原有的JSON文件存储方式迁移到MySQL数据库，提供了完整的CRUD操作和数据管理功能。

## 数据库结构

### 已创建的表
1. **img_history** - 存储图像处理历史记录
   - id (VARCHAR 255) - 唯一标识
   - imgUrl (VARCHAR 500) - 图像URL
   - imgSrc (VARCHAR 500) - 图像源
   - fileMd5 (VARCHAR 32) - 文件MD5值
   - ocrText (TEXT) - OCR识别文本
   - modelName (VARCHAR 100) - 使用的模型名称
   - created_at (DATETIME) - 创建时间
   - updated_at (DATETIME) - 更新时间

2. **models** - 存储文档处理模型
   - id (VARCHAR 255) - 唯一标识
   - modelName (VARCHAR 100) - 模型名称
   - description (TEXT) - 模型描述
   - glmTips (TEXT) - GLM提示信息
   - moreApi (TEXT) - 额外API信息
   - created_at (DATETIME) - 创建时间
   - updated_at (DATETIME) - 更新时间

3. **model_keywords** - 存储模型关键词关系
   - id (INT AUTO_INCREMENT) - 自增ID
   - model_id (VARCHAR 255) - 关联的模型ID
   - keyword_text (VARCHAR 255) - 关键词文本
   - keyword_index (INT) - 关键词索引

## 使用方法

### 1. 数据库配置
确保在 `.env` 文件中配置了正确的MySQL连接信息：
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vlm_ocr_db
DB_PORT=3306
```

### 2. 数据迁移
运行数据迁移脚本将现有JSON数据导入MySQL：
```bash
node scripts/migrateToMySQL.js
```

### 3. 启动服务
```bash
npm start
# 或
npm run dev
```

## API接口变更

### 图像历史接口 (`/history`)
- `GET /history` - 获取历史记录（支持分页、搜索）
- `GET /history/:id` - 根据ID获取单条记录
- `DELETE /history/:md5` - 根据MD5删除记录
- `GET /history/models` - 获取所有模型名称列表

### 模型管理接口 (`/models`)
- `GET /models` - 获取所有模型
- `GET /models/:id` - 根据ID获取单个模型
- `POST /models` - 创建新模型
- `PUT /models/:id` - 更新模型
- `DELETE /models/:id` - 删除模型
- `GET /models/search/:keyword` - 搜索模型

## 数据库操作工具

### MySQLHelper (`utils/mysql.js`)
提供统一的数据库操作方法：
- `query(sql, params)` - 执行SQL查询
- `insert(table, data)` - 插入单条记录
- `insertBatch(table, dataArray)` - 批量插入
- `update(table, data, where)` - 更新记录
- `delete(table, where)` - 删除记录
- `transaction(operations)` - 事务操作

### DatabaseService (`services/databaseService.js`)
提供业务相关的数据库操作：
- 图像历史记录的CRUD操作
- 模型管理的CRUD操作（含关键词关系）
- 搜索和统计功能

## 注意事项
1. 迁移前请备份原有的JSON文件
2. 确保MySQL服务已启动且配置正确
3. 数据库字符集使用utf8mb4，支持emoji等特殊字符
4. 所有时间字段自动使用当前时间戳
5. 外键关系已建立，删除模型时会自动删除关联的关键词