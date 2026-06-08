var express = require('express');
var router = express.Router();
const AuthService = require('../services/authService');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

router.post('/register', async function(req, res) {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码是必填项' });
    }

    const result = await AuthService.register(username, password, email);
    res.status(201).json({ message: '用户注册成功', userId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async function(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码是必填项' });
    }

    const authResult = await AuthService.login(username, password);
    res.json({
      message: '登录成功',
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async function(req, res) {
  try {
    const user = await AuthService.getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/change-password', authMiddleware, async function(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码是必填项' });
    }

    const result = await AuthService.changePassword(req.user.userId, oldPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async function(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { username, email } = req.body;
    const isSelf = req.user.userId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: '权限不足' });
    }

    if (!username && !email) {
      return res.status(400).json({ error: '至少需要提供一个要更新的字段' });
    }

    const result = await AuthService.updateUser(userId, { username, email });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, requireAdmin, async function(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    const result = await AuthService.deleteUser(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, requireAdmin, async function(req, res) {
  try {
    const users = await AuthService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
