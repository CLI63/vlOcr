/**
 * 数据库重建脚本
 * 根据DATABASE_MIGRATION.md文档重新创建所有必要的表结构
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'myocr',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
};

/**
 * 创建数据库连接
 */
async function createConnection() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            charset: dbConfig.charset
        });
        return connection;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        throw error;
    }
}

/**
 * 执行SQL脚本 (兼容MySQL 5.5)
 */
async function executeSqlScript(connection, sql) {
    // 移除注释行
    let cleanSql = sql.replace(/--.*$/gm, '');
    
    const statements = cleanSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
        if (statement.toUpperCase().includes('DROP TABLE') || 
            statement.toUpperCase().includes('CREATE TABLE') ||
            statement.toUpperCase().includes('INSERT INTO') ||
            statement.toUpperCase().includes('CREATE INDEX') ||
            statement.toUpperCase().includes('USE')) {
            try {
                await connection.query(statement);
                console.log('执行成功:', statement.substring(0, 50) + '...');
            } catch (error) {
                if (!error.message.includes('Unknown database') && 
                    !error.message.includes('doesn\'t exist')) {
                    console.warn('执行警告:', error.message);
                }
            }
        }
    }
}

/**
 * 主函数
 */
async function recreateDatabase() {
    console.log('开始重建数据库表结构...');
    console.log('数据库配置:', {
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port
    });

    let connection;
    try {
        // 创建连接
        connection = await createConnection();
        
        // 创建数据库（如果不存在）
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('数据库创建/确认完成');
        
        // 切换到指定数据库
        await connection.query(`USE \`${dbConfig.database}\``);
        
        // 读取并执行SQL文件
        const sqlPath = path.join(__dirname, '..', 'sql', 'recreate_tables.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        await executeSqlScript(connection, sqlContent);
        
        console.log('数据库表结构重建完成！');
        
    } catch (error) {
        console.error('重建数据库时出错:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    recreateDatabase();
}

module.exports = { recreateDatabase };