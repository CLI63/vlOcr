var express = require('express');
var router = express.Router();
const AuthService = require('../services/authService');
const authMiddleware = require('../middleware/auth');

// 用户注册
router.post('/register', async function(req, res, next) {
  try {
    const { username, password, email } = req.body;
    
    // 参数验证
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码是必填项' });
    }
    
    // 注册用户
    const result = await AuthService.register(username, password, email);
    res.status(201).json({ message: '用户注册成功', userId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 用户登录
router.post('/login', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    
    // 参数验证
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码是必填项' });
    }
    
    // 用户登录
    const authResult = await AuthService.login(username, password);
    res.json({
      message: '登录成功',
      token: authResult.token,
      user: authResult.user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async function(req, res, next) {
  try {
    const user = await AuthService.getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// 修改密码
router.post('/change-password', authMiddleware, async function(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // 参数验证
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码是必填项' });
    }
    
    // 修改密码
    const result = await AuthService.changePassword(req.user.userId, oldPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新用户信息
router.put('/:id', authMiddleware, async function(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    const { username, email } = req.body;
    
    // 参数验证
    if (!username && !email) {
      return res.status(400).json({ error: '至少需要提供一个要更新的字段' });
    }
    
    // 更新用户信息（移除只能修改自己信息的限制）
    const result = await AuthService.updateUser(userId, { username, email });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 删除用户
router.delete('/:id', authMiddleware, async function(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    
    // 删除用户（移除只能删除自己账户的限制）
    const result = await AuthService.deleteUser(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取用户列表
router.get('/', authMiddleware, async function(req, res, next) {
  try {
    // 获取所有用户列表
    const users = await AuthService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
