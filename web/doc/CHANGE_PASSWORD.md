# 密码修改接口文档

## 接口说明

修改用户密码，需要验证旧密码正确后才能修改为新密码。

## 接口地址

`POST /api/users/change-password`

## 请求头

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer token，登录时获取的token |

## 请求体

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| oldPassword | string | 是 | 用户的当前密码 |
| newPassword | string | 是 | 用户的新密码，至少6位 |

## 响应格式

### 成功响应

```json
{
  "message": "密码修改成功"
}
```

### 错误响应

#### 旧密码错误
```json
{
  "error": "旧密码错误"
}
```

#### 新密码格式不符合要求
```json
{
  "error": "新密码至少需要6位"
}
```

#### 缺少必需参数
```json
{
  "error": "旧密码和新密码是必填项"
}
```

#### 用户不存在
```json
{
  "error": "用户不存在"
}
```

#### 密码修改失败
```json
{
  "error": "密码修改失败"
}
```

## 使用示例

### cURL 示例

```bash
curl -X POST http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "current_password",
    "newPassword": "new_password_123"
  }'
```

### JavaScript (Axios) 示例

```javascript
const axios = require('axios');

const token = 'YOUR_TOKEN_HERE';

axios.post('http://localhost:3000/api/users/change-password', {
  oldPassword: 'current_password',
  newPassword: 'new_password_123'
}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('密码修改成功:', response.data.message);
})
.catch(error => {
  console.error('密码修改失败:', error.response.data.error);
});
```

### Python 示例

```python
import requests

url = 'http://localhost:3000/api/users/change-password'
token = 'YOUR_TOKEN_HERE'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

data = {
    'oldPassword': 'current_password',
    'newPassword': 'new_password_123'
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 200:
    print('密码修改成功:', response.json()['message'])
else:
    print('密码修改失败:', response.json()['error'])
```

## 注意事项

1. 调用此接口前需要先登录获取token
2. 新密码长度必须至少6位
3. 旧密码必须完全匹配当前密码
4. 修改成功后，原有的token仍然有效，不需要重新登录
5. 建议修改密码后更新本地存储的密码信息