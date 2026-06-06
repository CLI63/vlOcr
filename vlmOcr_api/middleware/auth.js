const AuthService = require('../services/authService');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'vlm_ocr_secret_key';
const JWT_EXPIRES_IN = '24h';


// 认证中间件
const authMiddleware = async (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: '访问令牌缺失' });
        }

        // 验证token
        const decoded = await AuthService.verifyToken(token);
        req.user = decoded;
        
        // 生成新的token（续期）
        const newToken = jwt.sign(
            { userId: decoded.userId, username: decoded.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // 将新token添加到响应头
        res.setHeader('X-New-Token', newToken);
        
        next();
    } catch (error) {
        return res.status(403).json({ error: '无效的访问令牌' });
    }
};

module.exports = authMiddleware;