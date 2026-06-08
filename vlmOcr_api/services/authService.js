const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MySQLHelper } = require('../utils/mysql');
const config = require('../config/appConfig');

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = config.jwtExpiresIn;

class AuthService {
    // 用户注册
    static async register(username, password, email) {
        // 检查用户名是否已存在
        const existingUser = await MySQLHelper.findOne('users', { username });
        if (existingUser) {
            throw new Error('用户名已存在');
        }

        // 检查邮箱是否已存在
        if (email) {
            const existingEmail = await MySQLHelper.findOne('users', { email });
            if (existingEmail) {
                throw new Error('邮箱已被注册');
            }
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const userData = {
            username,
            password: hashedPassword,
            email,
            role: 'user'
        };

        const result = await MySQLHelper.insert('users', userData);
        return result;
    }

    // 用户登录
    static async login(username, password) {
        // 查找用户
        const user = await MySQLHelper.findOne('users', { username });
        if (!user) {
            throw new Error('用户不存在');
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('密码错误');
        }

        // 生成token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user'
            }
        };
    }

    // 验证token
    static async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('无效的token');
        }
    }

    // 获取用户信息
    static async getUserById(userId) {
        const user = await MySQLHelper.findOne('users', { id: userId });
        if (!user) {
            throw new Error('用户不存在');
        }
        
        // 移除密码字段
        const { password, ...userInfo } = user;
        return userInfo;
    }

    // 修改密码
    static async changePassword(userId, oldPassword, newPassword) {
        // 查找用户
        const user = await MySQLHelper.findOne('users', { id: userId });
        if (!user) {
            throw new Error('用户不存在');
        }

        // 验证旧密码
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new Error('旧密码错误');
        }

        // 验证新密码长度
        if (!newPassword || newPassword.length < 6) {
            throw new Error('新密码至少需要6位');
        }

        // 加密新密码
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        const result = await MySQLHelper.update('users', { password: hashedNewPassword }, { id: userId });
        
        if (!result || result.affectedRows === 0) {
            throw new Error('密码修改失败：用户不存在或密码未发生变化');
        }

        return { message: '密码修改成功' };
    }

    // 更新用户信息
    static async updateUser(userId, updateData) {
        // 查找用户
        const user = await MySQLHelper.findOne('users', { id: userId });
        if (!user) {
            throw new Error('用户不存在');
        }

        // 允许更新的字段
        const allowedFields = ['username', 'email'];
        const filteredData = {};
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        // 如果更新用户名，检查是否已存在
        if (filteredData.username && filteredData.username !== user.username) {
            const existingUser = await MySQLHelper.findOne('users', { username: filteredData.username });
            if (existingUser) {
                throw new Error('用户名已存在');
            }
        }

        // 如果更新邮箱，检查是否已存在
        if (filteredData.email && filteredData.email !== user.email) {
            const existingEmail = await MySQLHelper.findOne('users', { email: filteredData.email });
            if (existingEmail) {
                throw new Error('邮箱已被注册');
            }
        }

        // 更新用户信息
        const result = await MySQLHelper.update('users', filteredData, { id: userId });
        if (result.affectedRows === 0) {
            throw new Error('用户信息更新失败');
        }

        // 返回更新后的用户信息（不包含密码）
        const updatedUser = await MySQLHelper.findOne('users', { id: userId });
        const { password, ...userInfo } = updatedUser;
        return { message: '用户信息更新成功', user: userInfo };
    }

    // 删除用户
    static async deleteUser(userId) {
        // 查找用户
        const user = await MySQLHelper.findOne('users', { id: userId });
        if (!user) {
            throw new Error('用户不存在');
        }

        // 禁止删除admin用户
        if (user.username === 'admin') {
            throw new Error('不能删除admin用户');
        }

        // 删除用户
        const result = await MySQLHelper.delete('users', { id: userId });
        if (result.affectedRows === 0) {
            throw new Error('用户删除失败');
        }

        return { message: '用户删除成功' };
    }

    // 获取所有用户列表
    static async getAllUsers() {
        const query = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';
        const users = await MySQLHelper.query(query);
        return users;
    }
}

module.exports = AuthService;
