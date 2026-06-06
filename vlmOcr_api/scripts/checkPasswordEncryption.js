const { MySQLHelper } = require('../utils/mysql');

async function checkPasswordEncryption() {
    try {
        // 获取所有用户的密码信息
        const users = await MySQLHelper.findAll('users', {});
        
        console.log('检查用户密码加密情况：');
        console.log('================================');
        
        for (const user of users) {
            console.log(`用户ID: ${user.id}`);
            console.log(`用户名: ${user.username}`);
            console.log(`密码长度: ${user.password.length}`);
            console.log(`密码格式: ${user.password.startsWith('$2') ? 'bcrypt加密' : '可能是明文'}`);
            console.log(`密码示例: ${user.password.substring(0, 20)}...`);
            console.log('--------------------------------');
        }
        
        // 检查是否有明文密码
        const plainTextPasswords = users.filter(user => !user.password.startsWith('$2'));
        if (plainTextPasswords.length > 0) {
            console.log(`\n⚠️ 发现 ${plainTextPasswords.length} 个用户密码可能是明文存储：`);
            plainTextPasswords.forEach(user => {
                console.log(`- ${user.username}: ${user.password}`);
            });
        } else {
            console.log('\n✅ 所有用户密码都已正确加密');
        }
        
    } catch (error) {
        console.error('检查密码时出错:', error);
    } finally {
        process.exit(0);
    }
}

checkPasswordEncryption();