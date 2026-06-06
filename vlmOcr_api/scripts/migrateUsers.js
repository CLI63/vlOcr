const { MySQLHelper } = require('../utils/mysql');

async function createUsersTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    try {
        await MySQLHelper.query(sql);
        console.log('Users table created successfully');
    } catch (error) {
        console.error('Error creating users table:', error);
    }
}

// 执行迁移
createUsersTable().then(() => {
    process.exit(0);
});