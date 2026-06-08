const mysql = require('mysql2/promise');
const config = require('../config/appConfig');

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const safeOrderByValues = new Set([
  'id ASC',
  'id DESC',
  'created_at ASC',
  'created_at DESC',
  'updated_at ASC',
  'updated_at DESC',
]);

function safeLimit(limit, fallback = 100, max = 1000) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

class MySQLHelper {
  static async query(sql, params = []) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  static async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    return await this.query(sql, values);
  }

  static async batchInsert(table, dataArray) {
    if (dataArray.length === 0) return;

    const keys = Object.keys(dataArray[0]);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      for (const data of dataArray) {
        const values = keys.map((key) => data[key]);
        await connection.execute(sql, values);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Batch insert error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(table, data, where) {
    const setClause = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
    const values = [...Object.values(data), ...Object.values(where)];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    return await this.query(sql, values);
  }

  static async delete(table, where) {
    const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    return await this.query(sql, values);
  }

  static async findOne(table, where) {
    const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const results = await this.query(sql, values);
    return results.length > 0 ? results[0] : null;
  }

  static async findAll(table, where = {}, orderBy = 'id DESC', limit = null) {
    let sql = `SELECT * FROM ${table}`;
    let values = [];

    if (Object.keys(where).length > 0) {
      const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values = Object.values(where);
    }

    const safeOrderBy = safeOrderByValues.has(orderBy) ? orderBy : 'id DESC';
    sql += ` ORDER BY ${safeOrderBy}`;

    if (limit) {
      sql += ` LIMIT ${safeLimit(limit)}`;
    }

    return await this.query(sql, values);
  }

  static async tableExists(tableName) {
    const sql = 'SHOW TABLES LIKE ?';
    const results = await this.query(sql, [tableName]);
    return results.length > 0;
  }

  static async describeTable(tableName) {
    const sql = `DESCRIBE ${tableName}`;
    return await this.query(sql);
  }

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
      console.error('Transaction error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

module.exports = { MySQLHelper, pool, safeLimit, testConnection };
