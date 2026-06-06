const { MySQLHelper } = require('../utils/mysql');
const bcrypt = require('bcrypt');

async function checkAllUsers() {
    try {
        console.log('检查所有用户的密码情况...');
        console.log('================================');
        
        // 获取所有用户
        const users = await MySQLHelper.findAll('users', {});
        console.log(`共找到 ${users.length} 个用户`);
        
        for (const user of users) {
            console.log(`\n用户: ${user.username} (ID: ${user.id})`);
            console.log(`密码哈希: ${user.password}`);
            
            // 测试123456是否匹配
            const matches123456 = await bcrypt.compare('123456', user.password);
            console.log(`密码 '123456' 是否匹配: ${matches123456}`);
            
            // 检查密码格式
            if (user.password === '123456') {
                console.log('⚠️  发现明文密码: 123456');
            } else if (user.password.length < 20) {
                console.log('⚠️  密码可能不是bcrypt格式');
            } else {
                console.log('✅ 密码格式正确');
            }
        }
        
        // 检查是否有密码为123456的用户
        const plain123456Users = users.filter(user => user.password === '123456');
        if (plain123456Users.length > 0) {
            console.log('\n🔍 发现使用明文密码123456的用户:');
            plain123456Users.forEach(user => {
                console.log(`- ${user.username}`);
            });
        }
        
    } catch (error) {
        console.error('检查用户时出错:', error);
    } finally {
        process.exit(0);
    }
}

checkAllUsers();