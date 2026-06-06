# 用户认证API文档

本文档描述了用户认证相关的API接口，包括用户注册、登录、获取用户信息等功能。

## 基础信息

- **Base URL**: `http://localhost:3001`
- **认证方式**: Bearer Token
- **Token有效期**: 30分钟（滑动窗口，每次请求后重置）

## 接口概览

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 用户注册 | POST | /users/register | 创建新用户账户 |
| 用户登录 | POST | /users/login | 用户登录获取token |
| 获取用户信息 | GET | /users/me | 获取当前登录用户信息 |
| 获取用户列表 | GET | /users | 获取所有用户列表 |
| 修改密码 | POST | /users/change-password | 修改用户密码 |
| 更新用户信息 | PUT | /users/:id | 更新用户名和邮箱 |
| 删除用户 | DELETE | /users/:id | 删除用户账户 |

## 详细接口说明

### 1. 用户注册

创建新的用户账户。

#### 请求信息
- **URL**: `/users/register`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| username | string | 是 | 用户名，唯一 |
| password | string | 是 | 密码，最少6位 |
| email | string | 否 | 邮箱地址，唯一 |

#### 请求示例
```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com"
}
```

#### 响应示例
**成功响应 (201)**:
```json
{
  "message": "用户注册成功",
  "userId": 1
}
```

**错误响应 (400)**:
```json
{
  "error": "用户名已存在"
}
```

### 2. 用户登录

用户登录系统，获取访问token。

#### 请求信息
- **URL**: `/users/login`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

#### 请求示例
```json
{
  "username": "testuser",
  "password": "123456"
}
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误响应 (401)**:
```json
{
  "error": "用户名或密码错误"
}
```

### 3. 获取用户信息

获取当前登录用户的详细信息。

#### 请求信息
- **URL**: `/users/me`
- **Method**: `GET`
- **认证**: 需要Bearer Token

#### 请求头
```
Authorization: Bearer <your_token_here>
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应 (401)**:
```json
{
  "error": "访问令牌缺失"
}
```

**错误响应 (403)**:
```json
{
  "error": "无效的访问令牌"
}
```

### 4. 获取用户列表

获取系统中所有用户的列表（不包含密码信息）。

#### 请求信息
- **URL**: `/users`
- **Method**: `GET`
- **认证**: 需要Bearer Token

#### 请求头
```
Authorization: Bearer <your_token_here>
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "username": "testuser",
      "email": "test@example.com",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**错误响应 (401)**:
```json
{
  "error": "访问令牌缺失"
}
```

**错误响应 (500)**:
```json
{
  "error": "服务器内部错误"
}
```

## 受保护接口

以下接口都需要在请求头中添加有效的Bearer Token：

- `GET /ocr`
- `POST /classify`
- `POST /classifyOcr`
- `GET /api/models`
- `POST /api/upload`
- `GET /api/history`

### Token续期机制
每次调用需要认证的接口时，系统会自动续期token，返回新的token到响应头中：
- **响应头**: `X-New-Token: <新的token>`
- **客户端处理**: 需要在收到响应后更新本地存储的token

### 使用示例

#### cURL示例
```bash
# 用户注册
curl -X POST http://localhost:3001/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","email":"test@example.com"}'

# 用户登录
curl -X POST http://localhost:3001/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# 获取用户信息（需要token）
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 访问受保护接口
curl -X GET http://localhost:3001/api/models \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### JavaScript示例
```javascript
// 用户注册
const registerResponse = await fetch('http://localhost:3001/users/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: '123456',
    email: 'test@example.com'
  })
});

// 用户登录
const loginResponse = await fetch('http://localhost:3001/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: '123456'
  })
});

const { token } = await loginResponse.json();

// 使用token访问受保护接口
const userResponse = await fetch('http://localhost:3001/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 错误码说明

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证，需要登录 |
| 403 | 认证失败，token无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 5. 修改密码

修改当前登录用户的密码。

#### 请求信息
- **URL**: `/users/change-password`
- **Method**: `POST`
- **认证**: 需要Bearer Token
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| oldPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码，最少6位 |

#### 请求示例
```json
{
  "oldPassword": "123456",
  "newPassword": "newpass123"
}
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "message": "密码修改成功"
}
```

**错误响应 (400)**:
```json
{
  "error": "新密码长度不能少于6位"
}
```

**错误响应 (401)**:
```json
{
  "error": "旧密码错误"
}
```

### 6. 更新用户信息

更新指定用户的信息（用户名和邮箱）。

#### 请求信息
- **URL**: `/users/:id`
- **Method**: `PUT`
- **认证**: 需要Bearer Token
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| username | string | 否 | 新用户名，唯一 |
| email | string | 否 | 新邮箱地址，唯一 |

**注意**: 至少需要提供一个参数

#### 请求示例
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### 响应示例
**成功响应 (200)**:
```json
{
  "message": "用户信息更新成功",
  "user": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误响应 (400)**:
```json
{
  "error": "用户名已存在"
}
```



### 7. 删除用户

删除指定的用户账户。

#### 请求信息
- **URL**: `/users/:id`
- **Method**: `DELETE`
- **认证**: 需要Bearer Token

#### 响应示例
**成功响应 (200)**:
```json
{
  "message": "用户删除成功"
}
```

**错误响应 (404)**:
```json
{
  "error": "用户不存在"
}
```

## 受保护接口

以下接口都需要在请求头中添加有效的Bearer Token：

- `GET /ocr`
- `POST /classify`
- `POST /classifyOcr`
- `GET /api/models`
- `POST /api/upload`
- `GET /api/history`
- `GET /users`
- `POST /users/change-password`
- `PUT /users/:id`
- `DELETE /users/:id`

### Token续期机制
每次调用需要认证的接口时，系统会自动续期token，返回新的token到响应头中：
- **响应头**: `X-New-Token: <新的token>`
- **客户端处理**: 需要在收到响应后更新本地存储的token

### 使用示例

#### cURL示例
```bash
# 用户注册
curl -X POST http://localhost:3001/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","email":"test@example.com"}'

# 用户登录
curl -X POST http://localhost:3001/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# 获取用户信息（需要token）
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取用户列表（需要token）
curl -X GET http://localhost:3001/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 修改密码（需要token）
curl -X POST http://localhost:3001/users/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"123456","newPassword":"newpass123"}'

# 更新用户信息（需要token）
curl -X PUT http://localhost:3001/users/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"username":"newusername","email":"newemail@example.com"}'

# 删除用户（需要token）
curl -X DELETE http://localhost:3001/users/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 访问受保护接口
curl -X GET http://localhost:3001/api/models \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### JavaScript示例
```javascript
// 用户注册
const registerResponse = await fetch('http://localhost:3001/users/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: '123456',
    email: 'test@example.com'
  })
});

// 用户登录
const loginResponse = await fetch('http://localhost:3001/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: '123456'
  })
});

const { token } = await loginResponse.json();

// 使用token访问受保护接口
const userResponse = await fetch('http://localhost:3001/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 获取用户列表
const usersResponse = await fetch('http://localhost:3001/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 修改密码
const changePasswordResponse = await fetch('http://localhost:3001/users/change-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    oldPassword: '123456',
    newPassword: 'newpass123'
  })
});

// 更新用户信息
const updateUserResponse = await fetch('http://localhost:3001/users/1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'newusername',
    email: 'newemail@example.com'
  })
});

// 删除用户
const deleteUserResponse = await fetch('http://localhost:3001/users/1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 错误码说明

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证，需要登录 |
| 403 | 认证失败，token无效或无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. **权限控制**: 用户只能修改或删除自己的账户信息
2. **用户名唯一性**: 用户名必须唯一，更新时会检查
3. **邮箱唯一性**: 如果提供邮箱，也必须唯一
4. **密码安全**: 密码在数据库中加密存储，不会明文返回
5. **Token有效期**: Token有效期为30分钟（滑动窗口），每次请求后自动续期
6. **Token使用**: 所有需要认证的接口都需要在请求头中添加 `Authorization: Bearer <token>`