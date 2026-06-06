const bcrypt = require('bcrypt');
const { MySQLHelper } = require('../utils/mysql');
const AuthService = require('../services/authService');

async function testLoginWith123456() {
    try {
        console.log('测试登录验证过程...');
        console.log('================================');
        
        // 使用现有用户进行测试
        const testUsername = 'testuser';
        const testPassword = '123456';
        
        console.log(`使用现有用户 ${testUsername} 进行测试`);
        
        // 获取用户信息
        const user = await MySQLHelper.findOne('users', { username: testUsername });
        if (!user) {
            console.error('❌ 测试用户不存在');
            return;
        }
        
        console.log(`用户密码哈希: ${user.password}`);
        console.log(`密码哈希长度: ${user.password.length}`);
        
        // 验证bcrypt.compare的行为
        console.log('\n验证bcrypt.compare过程：');
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`bcrypt.compare('123456', user.password) = ${isValid}`);
        
        // 测试错误密码
        const isInvalid = await bcrypt.compare('wrongpass', user.password);
        console.log(`bcrypt.compare('wrongpass', user.password) = ${isInvalid}`);
        
        // 测试AuthService.login
        console.log('\n测试AuthService.login：');
        try {
            const loginResult = await AuthService.login(testUsername, testPassword);
            console.log('✅ 登录成功，获得token');
            console.log(`Token: ${loginResult.token.substring(0, 20)}...`);
        } catch (error) {
            console.error(`❌ 登录失败: ${error.message}`);
        }
        
        // 测试错误密码登录
        console.log('\n测试错误密码登录：');
        try {
            await AuthService.login(testUsername, 'wrongpass');
            console.error('❌ 错误密码竟然登录成功！');
        } catch (error) {
            console.log(`✅ 错误密码正确被拒绝: ${error.message}`);
        }
        
        // 清理测试用户
        try {
            await MySQLHelper.delete('users', { username: testUsername });
            console.log('\n✅ 测试用户已清理');
        } catch (error) {
            console.log('\n⚠️ 测试用户清理失败:', error.message);
        }
        
    } catch (error) {
        console.error('测试过程中出错:', error);
    } finally {
        process.exit(0);
    }
}

testLoginWith123456();