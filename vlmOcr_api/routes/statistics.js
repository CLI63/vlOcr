const express = require('express');
const router = express.Router();
const { MySQLHelper } = require('../utils/mysql');
const authMiddleware = require('../middleware/auth');

function scopedWhere(user, params = []) {
  if (user.role === 'admin') {
    return { clause: '1=1', params };
  }
  return { clause: 'user_id = ?', params: [...params, user.userId] };
}

function validateDateRange(startDate, endDate, maxDays = 31) {
  if (!startDate || !endDate) {
    return '请提供startDate和endDate参数，格式：YYYY-MM-DD';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '日期格式无效，请使用YYYY-MM-DD格式';
  }

  if (start > end) {
    return '开始日期不能晚于结束日期';
  }

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    return `日期范围不能超过${maxDays}天`;
  }

  return null;
}

function generateDateSeries(start, end) {
  const dates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

router.get('/daily-ocr', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const error = validateDateRange(startDate, endDate);
    if (error) {
      return res.status(400).json({ error });
    }

    const scope = scopedWhere(req.user, [startDate, endDate]);
    const query = `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as ocr_count
      FROM img_history
      WHERE DATE_FORMAT(created_at, '%Y-%m-%d') BETWEEN ? AND ? AND ${scope.clause}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC
    `;
    const results = await MySQLHelper.query(query, scope.params);
    const resultMap = {};
    results.forEach((row) => {
      resultMap[row.date] = parseInt(row.ocr_count, 10);
    });

    const completeData = generateDateSeries(startDate, endDate).map((date) => ({
      date,
      ocr_count: resultMap[date] || 0,
    }));

    res.json({ data: completeData, totalDays: completeData.length, dateRange: { start: startDate, end: endDate } });
  } catch (error) {
    console.error('Failed to get daily OCR stats:', error.message);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

router.get('/total-ocr', authMiddleware, async (req, res) => {
  try {
    const scope = scopedWhere(req.user);
    const query = `
      SELECT
        COUNT(*) as total_ocr_count,
        COUNT(DISTINCT DATE(created_at)) as total_days,
        MIN(created_at) as first_ocr_date,
        MAX(created_at) as last_ocr_date
      FROM img_history
      WHERE ${scope.clause}
    `;
    const result = await MySQLHelper.query(query, scope.params);
    res.json({
      data: result[0] || {
        total_ocr_count: 0,
        total_days: 0,
        first_ocr_date: null,
        last_ocr_date: null,
      },
    });
  } catch (error) {
    console.error('Failed to get total OCR stats:', error.message);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

router.get('/model-ocr', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const conditions = [];
    const params = [];

    if (startDate && endDate) {
      const error = validateDateRange(startDate, endDate);
      if (error) {
        return res.status(400).json({ error });
      }
      conditions.push('DATE(created_at) BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    const scope = scopedWhere(req.user, params);
    conditions.push(scope.clause);
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT
        modelName as model_name,
        COUNT(*) as ocr_count,
        DATE_FORMAT(MIN(created_at), '%Y-%m-%d') as first_use_date,
        DATE_FORMAT(MAX(created_at), '%Y-%m-%d') as last_use_date
      FROM img_history
      ${whereClause}
      GROUP BY modelName
      ORDER BY ocr_count DESC
    `;
    const results = await MySQLHelper.query(query, scope.params);

    const totalQuery = `SELECT COUNT(*) as total_count FROM img_history ${whereClause}`;
    const totalResult = await MySQLHelper.query(totalQuery, scope.params);

    res.json({
      data: results,
      totalCount: totalResult[0]?.total_count || 0,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
    });
  } catch (error) {
    console.error('Failed to get model OCR stats:', error.message);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultEndDate.getDate() - 6);

    const start = req.query.startDate || defaultStartDate.toISOString().split('T')[0];
    const end = req.query.endDate || defaultEndDate.toISOString().split('T')[0];
    const error = validateDateRange(start, end);
    if (error) {
      return res.status(400).json({ error });
    }
    const scope = scopedWhere(req.user, [start, end]);
    const totalScope = scopedWhere(req.user);

    const [dailyStats, totalStats, modelStats] = await Promise.all([
      MySQLHelper.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as ocr_count
        FROM img_history
        WHERE DATE_FORMAT(created_at, '%Y-%m-%d') BETWEEN ? AND ? AND ${scope.clause}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
      `, scope.params),
      MySQLHelper.query(`
        SELECT
          COUNT(*) as total_ocr_count,
          COUNT(DISTINCT DATE(created_at)) as total_days,
          MIN(created_at) as first_ocr_date,
          MAX(created_at) as last_ocr_date
        FROM img_history
        WHERE ${totalScope.clause}
      `, totalScope.params),
      MySQLHelper.query(`
        SELECT modelName as model_name, COUNT(*) as ocr_count,
          DATE_FORMAT(MIN(created_at), '%Y-%m-%d') as first_use_date,
          DATE_FORMAT(MAX(created_at), '%Y-%m-%d') as last_use_date
        FROM img_history
        WHERE DATE_FORMAT(created_at, '%Y-%m-%d') BETWEEN ? AND ? AND ${scope.clause}
        GROUP BY modelName
        ORDER BY ocr_count DESC
      `, scope.params),
    ]);

    const resultMap = {};
    dailyStats.forEach((row) => {
      resultMap[row.date] = parseInt(row.ocr_count, 10);
    });

    const completeDailyData = generateDateSeries(start, end).map((date) => ({
      date,
      ocr_count: resultMap[date] || 0,
    }));

    res.json({
      dailyStats: { data: completeDailyData, totalDays: completeDailyData.length, dateRange: { start, end } },
      totalStats: totalStats[0] || {
        total_ocr_count: 0,
        total_days: 0,
        first_ocr_date: null,
        last_ocr_date: null,
      },
      modelStats: {
        data: modelStats,
        totalCount: modelStats.reduce((sum, item) => sum + item.ocr_count, 0),
      },
    });
  } catch (error) {
    console.error('Failed to get summary stats:', error.message);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

module.exports = router;
