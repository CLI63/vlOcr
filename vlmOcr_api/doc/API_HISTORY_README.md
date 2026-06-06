# 历史记录管理 API 文档

## 接口概览

本文档描述了用于管理图片识别历史记录的 RESTful API 接口，所有接口均以 `/api/history` 为前缀。

## 接口列表

### 1. 分页查询历史记录

**接口地址**: `GET /api/history`

**功能描述**: 分页查询历史识别记录，支持按图片URL、文件MD5、模型名称进行筛选。

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码，从1开始 |
| limit | number | 否 | 10 | 每页条数，最大100 |
| imgUrl | string | 否 | - | 模糊匹配图片URL |
| fileMd5 | string | 否 | - | 精确匹配文件MD5 |
| modelName | string | 否 | - | 精确匹配模型名称 |

**请求示例**:
```bash
# 基础查询
curl "http://localhost:3000/api/history"

# 分页查询
curl "http://localhost:3000/api/history?page=2&limit=5"

# 按条件筛选
curl "http://localhost:3000/api/history?modelName=工资支付单&limit=20"

# 组合查询
curl "http://localhost:3000/api/history?imgUrl=uploads&fileMd5=34d53232219f1c3fe635559f5dfc9612"
```

**成功响应**:
```json
{
  "data": [
    {
      "id": "unique-id-123",
      "imgUrl": "http://localhost:3000/uploads/image.jpg",
      "imgSrc": "/uploads/image.jpg",
      "fileMd5": "34d53232219f1c3fe635559f5dfc9612",
      "ocrText": "识别出的文字内容",
      "ocrInfo": "完整的OCR信息",
      "modelName": "工资支付单",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

**错误响应**:
```json
{
  "error": "查询历史记录失败",
  "message": "具体的错误信息"
}
```

### 2. 删除历史记录

**接口地址**: `DELETE /api/history/:fileMd5`

**功能描述**: 根据文件MD5值删除对应的历史记录。

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fileMd5 | string | 是 | 要删除的文件的MD5值 |

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/history/34d53232219f1c3fe635559f5dfc9612"
```

**成功响应**:
```json
{
  "message": "删除成功",
  "deletedCount": 1,
  "fileMd5": "34d53232219f1c3fe635559f5dfc9612"
}
```

**错误响应**:
```json
{
  "error": "记录不存在",
  "message": "没有找到fileMd5为34d53232219f1c3fe635559f5dfc9612的记录"
}
```

### 3. 获取模型列表

**接口地址**: `GET /api/history/models`

**功能描述**: 获取所有在历史记录中出现过的模型名称列表。

**请求示例**:
```bash
curl "http://localhost:3000/api/history/models"
```

**成功响应**:
```json
[
  "工资支付单",
  "增值税发票",
  "身份证",
  "驾驶证",
  "银行卡"
]
```

**错误响应**:
```json
{
  "error": "获取模型列表失败",
  "message": "具体的错误信息"
}
```

## 数据字段说明

### 历史记录对象字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 唯一标识符 |
| imgUrl | string | 图片的完整URL地址 |
| imgSrc | string | 图片的相对路径 |
| fileMd5 | string | 文件的MD5哈希值 |
| ocrText | string | OCR识别的纯文本内容 |
| ocrInfo | string | 完整的OCR识别信息 |
| modelName | string | 识别使用的模型名称 |
| timestamp | string | 记录创建时间（ISO格式） |

## 错误处理

所有接口在发生错误时都会返回统一的错误格式：

```json
{
  "error": "错误类型",
  "message": "详细的错误描述"
}
```

常见的HTTP状态码：
- `200 OK`: 请求成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 使用场景示例

### 场景1：查看最近识别记录
```bash
curl "http://localhost:3000/api/history?limit=20"
```

### 场景2：查找特定模型的记录
```bash
# 先查看有哪些模型
curl "http://localhost:3000/api/history/models"

# 再查询特定模型
curl "http://localhost:3000/api/history?modelName=工资支付单"
```

### 场景3：清理重复记录
```bash
# 删除特定MD5的记录
curl -X DELETE "http://localhost:3000/api/history/重复的MD5值"
```

## 注意事项

1. 所有时间均为UTC格式
2. 文件MD5值区分大小写
3. 分页查询时，如果数据为空会返回空数组而非404
4. 删除操作是不可逆的，请谨慎操作
5. 建议在生产环境中添加身份验证