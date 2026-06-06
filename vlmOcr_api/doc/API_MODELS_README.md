# 模型管理API接口文档

## 接口说明

本API提供了对 `jsonDB/model.json` 文件的完整增删改查功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api/models`
- **数据格式**: JSON
- **编码**: UTF-8

## API接口列表

### 1. 获取所有模型
- **URL**: `GET /api/models`
- **描述**: 获取所有模型列表
- **响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "modelName": "工资支付单",
      "description": "工资单识别模型",
      "keyWords": [...],
      "glmTips": "...",
      "moreApi": "GLM-4.1V-Thinking-Flash"
    }
  ],
  "message": "获取模型列表成功"
}
```

### 2. 获取单个模型
- **URL**: `GET /api/models/:id`
- **描述**: 根据ID获取单个模型详情
- **参数**: `id` - 模型ID
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "modelName": "工资支付单",
    "description": "工资单识别模型",
    "keyWords": [...],
    "glmTips": "...",
    "moreApi": "GLM-4.1V-Thinking-Flash"
  },
  "message": "获取模型成功"
}
```

### 3. 创建新模型
- **URL**: `POST /api/models`
- **描述**: 创建新的模型
- **请求体**:
```json
{
  "id": "4",
  "modelName": "新模型名称",
  "description": "模型描述",
  "keyWords": [
    {
      "text": "关键词1",
      "index": 1
    }
  ],
  "glmTips": "提示信息",
  "moreApi": "使用的API"
}
```
- **响应示例**:
```json
{
  "success": true,
  "data": {创建的模型数据},
  "message": "创建模型成功"
}
```

### 4. 更新模型
- **URL**: `PUT /api/models/:id`
- **描述**: 更新现有模型
- **参数**: `id` - 模型ID
- **请求体**: 需要更新的字段
```json
{
  "modelName": "更新后的名称",
  "description": "更新后的描述"
}
```
- **响应示例**:
```json
{
  "success": true,
  "data": {更新后的模型数据},
  "message": "更新模型成功"
}
```

### 5. 删除模型
- **URL**: `DELETE /api/models/:id`
- **描述**: 删除指定模型
- **参数**: `id` - 模型ID
- **响应示例**:
```json
{
  "success": true,
  "data": {被删除的模型数据},
  "message": "删除模型成功"
}
```

### 6. 搜索模型
- **URL**: `GET /api/models/search/:keyword`
- **描述**: 根据关键词搜索模型
- **参数**: `keyword` - 搜索关键词
- **响应示例**:
```json
{
  "success": true,
  "data": [匹配的模型列表],
  "message": "搜索完成，找到 2 个模型"
}
```

## 错误处理

所有接口在出错时会返回如下格式的错误信息：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

## 使用示例

### curl示例

**获取所有模型**:
```bash
curl http://localhost:3000/api/models
```

**创建新模型**:
```bash
curl -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "id": "4",
    "modelName": "测试模型",
    "description": "这是一个测试模型",
    "keyWords": [{"text": "测试", "index": 1}],
    "glmTips": "测试提示",
    "moreApi": "测试API"
  }'
```

**更新模型**:
```bash
curl -X PUT http://localhost:3000/api/models/4 \
  -H "Content-Type: application/json" \
  -d '{"modelName": "更新后的名称"}'
```

**删除模型**:
```bash
curl -X DELETE http://localhost:3000/api/models/4
```

**搜索模型**:
```bash
curl http://localhost:3000/api/models/search/发票
```

## 注意事项

1. 创建模型时必须提供 `id` 和 `modelName` 字段
2. 模型ID必须唯一，不能重复
3. 所有数据会实时保存到 `jsonDB/model.json` 文件
4. 文件操作是同步的，大量数据时可能会有轻微延迟