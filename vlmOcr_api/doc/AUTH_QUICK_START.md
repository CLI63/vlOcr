# 用户认证快速入门指南

## 🚀 快速开始

### 1. 启动服务
```bash
npm start
```
服务将在 `http://localhost:3000` 启动

### 2. 注册用户
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"123456","email":"demo@example.com"}'
```

### 3. 用户登录
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"123456"}'
```

### 4. 使用Token访问接口
```bash
# 保存返回的token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取用户信息（注意响应头中的X-New-Token）
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -i

# 访问OCR接口
curl -X POST http://localhost:3000/ocr \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.jpg"
```

## 📋 常用命令

### 测试认证功能
```bash
node scripts/testAuth.js
```

### 查看数据库
```sql
-- 查看用户表
SELECT * FROM users;

-- 清空测试数据
TRUNCATE TABLE users;
```

## 🛠️ 常见问题

### Q1: 端口被占用怎么办？
修改 `.env` 文件中的端口：
```
PORT=3002
```

### Q2: Token过期机制是怎样的？
Token有效期为24小时，采用滑动窗口机制：
- 每次请求后自动续期24小时
- 响应头中会返回新的token：`X-New-Token`
- 客户端需要更新本地存储的token

### Q3: 如何处理Token续期？
```javascript
// JavaScript示例
const response = await fetch('/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 检查是否有新的token
const newToken = response.headers.get('X-New-Token');
if (newToken) {
  localStorage.setItem('token', newToken);
}
```

### Q3: 如何跳过某些接口的认证？
修改 `app.js`，移除对应路由的 `authMiddleware`：
```javascript
// 移除authMiddleware即可跳过认证
app.use('/public-route', publicRouter);
```

### Q4: 如何重置密码？
需要添加新的接口，当前版本暂不支持。

## 🔍 调试技巧

### 检查请求头
确保请求头包含正确的Authorization：
```
Authorization: Bearer your_token_here
```

### 查看错误日志
- 服务端错误：查看控制台输出
- 网络错误：检查端口和网络连接
- 认证错误：确认token未过期且格式正确

## 🔧 用户管理操作

### 修改密码
```bash
curl -X POST http://localhost:3000/users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"123456","newPassword":"newpass123"}'
```

### 更新用户信息
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newname","email":"new@example.com"}'
```

### 删除账户
```bash
curl -X DELETE http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN"
```



## 前端集成示例

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000'
});

// 设置token
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// 响应拦截器处理token续期
api.interceptors.response.use((response) => {
  const newToken = response.headers['x-new-token'];
  if (newToken) {
    localStorage.setItem('token', newToken);
    setAuthToken(newToken);
  }
  return response;
});

// 登录并保存token
const login = async (username, password) => {
  const response = await api.post('/users/login', { username, password });
  const { token } = response.data;
  localStorage.setItem('token', token);
  setAuthToken(token);
  return response.data;
};
```

### React Hook示例
```javascript
import { useState, useEffect } from 'react';

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);
  
  const login = async (username, password) => {
    const response = await axios.post('/users/login', { username, password });
    const { token } = response.data;
    setToken(token);
    localStorage.setItem('token', token);
  };
  
  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };
  
  return { token, login, logout };
};
```

## 📝 下一步

1. 添加密码重置功能
2. 添加用户角色权限管理
3. 添加刷新token机制
4. 添加第三方登录支持

需要更多功能？查看完整文档：`API_AUTH_README.md`