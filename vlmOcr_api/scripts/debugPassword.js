const AuthService = require('../services/authService');
const { MySQLHelper } = require('../utils/mysql');

async function debugPasswordChange() {
    console.log('🔍 开始调试密码修改功能...\n');

    try {
        // 1. 创建测试用户
        console.log('1. 创建测试用户...');
        const testUsername = 'debug_user';
        const testPassword = '123456';
        const newPassword = 'Abcd123456&';

        // 先删除可能存在的测试用户
        await MySQLHelper.delete('users', { username: testUsername });

        // 注册用户
        const userId = await AuthService.register(testUsername, testPassword, 'debug@example.com');
        console.log('✅ 测试用户创建成功，ID:', userId.insertId);

        // 2. 验证用户存在
        console.log('2. 验证用户存在...');
        const user = await MySQLHelper.findOne('users', { id: userId.insertId });
        console.log('✅ 用户存在:', user.username);

        // 3. 验证旧密码
        console.log('3. 验证旧密码...');
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log('✅ 旧密码验证结果:', isValid);

        // 4. 尝试修改密码
        console.log('4. 尝试修改密码...');
        try {
            const result = await AuthService.changePassword(userId.insertId, testPassword, newPassword);
            console.log('✅ 密码修改成功:', result);
        } catch (error) {
            console.error('❌ 密码修改失败:', error.message);
            
            // 5. 检查更新结果
            console.log('5. 检查更新结果...');
            const updateResult = await MySQLHelper.update('users', 
                { password: await bcrypt.hash(newPassword, 10) }, 
                { id: userId.insertId }
            );
            console.log('6. 直接更新结果:', updateResult);
        }

        // 6. 清理测试数据
        await MySQLHelper.delete('users', { id: userId.insertId });
        console.log('✅ 测试数据清理完成');

    } catch (error) {
        console.error('❌ 调试过程中出现错误:', error.message);
    }
}

// 执行调试
if (require.main === module) {
    debugPasswordChange();
}

module.exports = debugPasswordChange;