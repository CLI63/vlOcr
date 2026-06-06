# 数据库重建指南

由于服务器重装导致数据库丢失，本指南将帮助您重新创建数据库表结构。

## 前提条件

1. 确保MySQL服务器已安装并运行
2. 确保`.env`文件中的数据库配置正确
3. 确保已安装项目依赖：`npm install`

## 重建步骤

### 方法1：使用Node.js脚本（推荐）

在项目根目录执行：
```bash
npm run recreate-db
```

### 方法2：使用SQL文件

1. 打开命令行，进入项目目录：
   ```bash
   cd f:\CEISHI\node\vlmOcr\sql
   ```

2. 使用MySQL命令行执行：
   ```bash
   mysql -h[DB_HOST] -P[DB_PORT] -u[DB_USER] -p[DB_PASSWORD] < recreate_tables.sql
   ```
   
   或者使用Windows批处理：
   ```bash
   run_recreate.bat
   ```

### 方法3：手动执行

1. 登录MySQL：
   ```bash
   mysql -h[DB_HOST] -P[DB_PORT] -u[DB_USER] -p[DB_PASSWORD]
   ```

2. 执行以下SQL：
   ```sql
   USE myocr;
   
   -- 创建图像历史记录表
   CREATE TABLE img_history (
       id VARCHAR(255) PRIMARY KEY,
       imgUrl VARCHAR(500),
       imgSrc VARCHAR(500),
       fileMd5 VARCHAR(32),
       ocrText TEXT,
       modelName VARCHAR(100),
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   -- 创建模型管理表
   CREATE TABLE models (
       id VARCHAR(255) PRIMARY KEY,
       modelName VARCHAR(100) NOT NULL,
       description TEXT,
       glmTips TEXT,
       moreApi TEXT,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   -- 创建模型关键词关系表
   CREATE TABLE model_keywords (
       id INT AUTO_INCREMENT PRIMARY KEY,
       model_id VARCHAR(255) NOT NULL,
       keyword_text VARCHAR(255) NOT NULL,
       keyword_index INT,
       FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
   );

   -- 添加索引
   CREATE INDEX idx_img_history_fileMd5 ON img_history(fileMd5);
   CREATE INDEX idx_img_history_created_at ON img_history(created_at);
   CREATE INDEX idx_model_keywords_model_id ON model_keywords(model_id);
   CREATE INDEX idx_model_keywords_keyword_text ON model_keywords(keyword_text);
   ```

## 验证

重建完成后，可以通过以下方式验证：

1. 检查表是否存在：
   ```sql
   SHOW TABLES;
   ```

2. 查看表结构：
   ```sql
   DESCRIBE img_history;
   DESCRIBE models;
   DESCRIBE model_keywords;
   ```

## 注意事项

1. 确保数据库用户有足够的权限
2. 如果连接失败，请检查防火墙设置
3. 字符集使用utf8mb4以支持emoji等特殊字符
4. 所有时间字段自动使用当前时间戳
5. 外键关系已建立，删除模型时会自动删除关联的关键词

## 故障排除

如果遇到权限错误：
1. 检查`.env`文件中的数据库配置
2. 确保数据库用户有CREATE、DROP、INSERT等权限
3. 可以尝试使用root用户执行

如果遇到连接错误：
1. 检查MySQL服务是否运行
2. 检查防火墙是否放行3306端口
3. 检查网络连接是否正常