const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vlm_ocr_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

class MySQLHelper {
    // 执行查询
    static async query(sql, params = []) {
        let connection;
        try {
            connection = await pool.getConnection();
            const [results] = await connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // 插入数据
    static async insert(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        return await this.query(sql, values);
    }

    // 批量插入
    static async batchInsert(table, dataArray) {
        if (dataArray.length === 0) return;
        
        const keys = Object.keys(dataArray[0]);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            for (const data of dataArray) {
                const values = keys.map(key => data[key]);
                await connection.execute(sql, values);
            }
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            console.error('Batch insert error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // 更新数据
    static async update(table, data, where) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        
        const values = [...Object.values(data), ...Object.values(where)];
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        
        return await this.query(sql, values);
    }

    // 删除数据
    static async delete(table, where) {
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const values = Object.values(where);
        
        const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
        return await this.query(sql, values);
    }

    // 查询单条记录
    static async findOne(table, where) {
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const values = Object.values(where);
        
        const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
        const results = await this.query(sql, values);
        return results.length > 0 ? results[0] : null;
    }

    // 查询多条记录
    static async findAll(table, where = {}, orderBy = 'id DESC', limit = null) {
        let sql = `SELECT * FROM ${table}`;
        let values = [];

        if (Object.keys(where).length > 0) {
            const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
            sql += ` WHERE ${whereClause}`;
            values = Object.values(where);
        }

        sql += ` ORDER BY ${orderBy}`;
        
        if (limit) {
            sql += ` LIMIT ${limit}`;
        }

        return await this.query(sql, values);
    }

    // 检查表是否存在
    static async tableExists(tableName) {
        const sql = `SHOW TABLES LIKE ?`;
        const results = await this.query(sql, [tableName]);
        return results.length > 0;
    }

    // 获取表结构
    static async describeTable(tableName) {
        const sql = `DESCRIBE ${tableName}`;
        return await this.query(sql);
    }

    // 执行事务
    static async transaction(queries) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const results = [];
            for (const { sql, params } of queries) {
                const [result] = await connection.execute(sql, params);
                results.push(result);
            }
            
            await connection.commit();
            return results;
        } catch (error) {
            await connection.rollback();
            console.error('Transaction error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

// 测试连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

// 初始化时测试连接
testConnection();

module.exports = { MySQLHelper, pool };