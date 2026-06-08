const jwt = require('jsonwebtoken');
const AuthService = require('../services/authService');
const config = require('../config/appConfig');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    const decoded = await AuthService.verifyToken(token);
    const currentUser = await AuthService.getUserById(decoded.userId);

    req.user = {
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role || 'user',
    };

    const newToken = jwt.sign(
      { userId: req.user.userId, username: req.user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.setHeader('X-New-Token', newToken);
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的访问令牌' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
