# VLM OCR项目

一个基于Node.js的OCR文字识别服务，支持图片上传、文字识别、模型管理等功能。

## 功能特性

- 🖼️ 图片上传和OCR文字识别
- 🔍 多种OCR模型支持
- 📊 识别历史记录管理
- 👥 用户认证和权限管理
- 🎯 模型关键词管理
- 📱 RESTful API接口

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL
- **OCR**: Tesseract.js / 百度OCR API
- **认证**: JWT
- **部署**: PM2 (可选)

## 快速开始

### 环境要求

- Node.js 16+
- MySQL 8.0+
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd vlmOcr
```

2. **安装依赖**
```bash
npm install
```

3. **配置数据库**
- 创建MySQL数据库
- 导入sql/users.sql文件
- 复制.env.example到.env并配置数据库连接

4. **启动服务**
```bash
npm start
```

5. **访问服务**
- 主页: http://localhost:3001
- API文档: http://localhost:3001/doc

## API文档

详细的API文档请查看doc目录：
- [认证API](doc/API_AUTH_README.md)
- [历史记录API](doc/API_HISTORY_README.md)
- [模型管理API](doc/API_MODELS_README.md)
- [文件上传API](doc/API_UPLOAD_README.md)

## 项目结构

```
vlmOcr/
├── app.js              # 主应用文件
├── bin/                # 启动脚本
├── doc/                # API文档
├── middleware/         # 中间件
├── ocrApi/            # OCR接口实现
├── routes/            # 路由定义
├── services/          # 业务逻辑
├── sql/               # 数据库脚本
├── utils/             # 工具函数
├── views/             # 视图模板
└── scripts/           # 测试和工具脚本
```

## 打包部署

项目已包含打包脚本，使用方法：

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File package.ps1 -Version 1.0.0
```

**Linux/Mac:**
```bash
chmod +x package.sh
./package.sh
```

## 注意事项

- 确保MySQL服务已启动
- 检查.env文件中的配置是否正确
- 首次启动会自动创建必要的表结构
- 大文件上传可能需要调整服务器配置

## 许可证

MIT License