# 文件上传API使用文档

## 基础信息
- **基础URL**: `http://localhost:3000`
- **API前缀**: `/api/upload`
- **文件存储**: 所有上传的文件保存在 `uploads/` 目录下
- **外部访问**: 上传的文件可通过URL直接访问，格式：`http://localhost:3000/uploads/文件名`

## API接口列表

### 1. 单文件上传
**URL**: `/api/upload/single`  
**方法**: `POST`  
**描述**: 上传单个文件

#### 请求参数
- **表单字段**: `file` (必填)
- **Content-Type**: `multipart/form-data`

#### 请求示例
```bash
curl -X POST http://localhost:3000/api/upload/single \
  -F "file=@/path/to/your/file.jpg"
```

#### 响应示例
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "filename": "example.jpg",
    "url": "http://localhost:3000/uploads/1735623456789-123456789.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

### 2. 多文件上传
**URL**: `/api/upload/multiple`  
**方法**: `POST`  
**描述**: 同时上传多个文件（最多10个）

#### 请求参数
- **表单字段**: `files` (必填，数组形式)
- **Content-Type**: `multipart/form-data`

#### 请求示例
```bash
curl -X POST http://localhost:3000/api/upload/multiple \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.png" \
  -F "files=@/path/to/file3.pdf"
```

#### 响应示例
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": [
    {
      "filename": "file1.jpg",
      "url": "http://localhost:3000/uploads/1735623456789-123456789.jpg",
      "size": 102400,
      "mimetype": "image/jpeg"
    },
    {
      "filename": "file2.png",
      "url": "http://localhost:3000/uploads/1735623456790-123456790.png",
      "size": 204800,
      "mimetype": "image/png"
    }
  ]
}
```

### 3. 获取文件列表
**URL**: `/api/upload/list`  
**方法**: `GET`  
**描述**: 获取所有已上传的文件列表

#### 请求示例
```bash
curl -X GET http://localhost:3000/api/upload/list
```

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "filename": "1735623456789-123456789.jpg",
      "url": "http://localhost:3000/uploads/1735623456789-123456789.jpg",
      "size": 102400,
      "uploadTime": "2024-12-31T12:34:56.789Z"
    }
  ]
}
```

### 4. 删除文件
**URL**: `/api/upload/:filename`  
**方法**: `DELETE`  
**描述**: 删除指定文件

#### 请求示例
```bash
curl -X DELETE http://localhost:3000/api/upload/1735623456789-123456789.jpg
```

#### 响应示例
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## 文件访问

### 直接访问文件
上传的文件可以通过以下URL直接访问：
```
http://localhost:3000/uploads/文件名
```

### 文件存储结构
- **存储目录**: `uploads/`
- **文件命名**: 时间戳+随机数+原始扩展名
- **文件大小限制**: 10MB
- **支持格式**: 所有文件类型

## 前端集成示例

### HTML表单上传
```html
<form action="http://localhost:3000/api/upload/single" method="post" enctype="multipart/form-data">
  <input type="file" name="file" />
  <button type="submit">上传文件</button>
</form>
```

### JavaScript Fetch上传
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3000/api/upload/single', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('上传成功:', data.data.url);
});
```

## 错误处理

### 常见错误码
- `400`: 没有选择文件或请求参数错误
- `404`: 文件不存在
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

## 注意事项
1. 确保服务器有写入 `uploads/` 目录的权限
2. 上传的文件名会重新生成，避免重名冲突
3. 文件URL是永久有效的，直到文件被删除
4. 建议在生产环境中添加身份验证和文件类型限制