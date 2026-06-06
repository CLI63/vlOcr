const express = require('express');
const router = express.Router();
const { MySQLHelper } = require('../utils/mysql');
const authMiddleware = require('../middleware/auth');

/**
 * 获取每日OCR识别数量统计
 * 支持日期范围查询，最多31天
 */
router.get('/daily-ocr', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // 验证日期参数
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: '请提供startDate和endDate参数，格式：YYYY-MM-DD' 
            });
        }

        // 验证日期格式和范围
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                error: '日期格式无效，请使用YYYY-MM-DD格式' 
            });
        }

        // 检查日期范围是否超过31天
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 31) {
            return res.status(400).json({ 
                error: '日期范围不能超过31天' 
            });
        }

        // 生成日期序列
        const generateDateSeries = (start, end) => {
            const dates = [];
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates;
        };

        // 查询每日OCR识别数量
        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                COUNT(*) as ocr_count
            FROM img_history 
            WHERE DATE_FORMAT(created_at, '%Y-%m-%d') BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            ORDER BY date ASC
        `;

        const results = await MySQLHelper.query(query, [startDate, endDate]);
        
        // 生成完整的日期序列
        const dateSeries = generateDateSeries(startDate, endDate);
        const resultMap = {};
        
        // 将查询结果转为map
        if (Array.isArray(results)) {
            results.forEach(row => {
                resultMap[row.date] = parseInt(row.ocr_count);
            });
        }

        // 补全缺失的日期
        const completeData = dateSeries.map(date => ({
            date: date,
            ocr_count: resultMap[date] || 0
        }));

        res.json({
            data: completeData,
            totalDays: completeData.length,
            dateRange: {
                start: startDate,
                end: endDate
            }
        });

    } catch (error) {
        console.error('获取每日OCR统计失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

/**
 * 获取总计OCR识别数量
 */
router.get('/total-ocr', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_ocr_count,
                COUNT(DISTINCT DATE(created_at)) as total_days,
                MIN(created_at) as first_ocr_date,
                MAX(created_at) as last_ocr_date
            FROM img_history
        `;

        const result = await MySQLHelper.query(query);

        res.json({
            data: result[0] || {
                total_ocr_count: 0,
                total_days: 0,
                first_ocr_date: null,
                last_ocr_date: null
            }
        });

    } catch (error) {
        console.error('获取总计OCR统计失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

/**
 * 获取每个模型的OCR识别数量统计
 * 支持日期范围查询
 */
router.get('/model-ocr', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let whereClause = '';
        let params = [];

        // 如果有日期参数，添加过滤条件
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                whereClause = 'WHERE DATE(created_at) BETWEEN ? AND ?';
                params = [startDate, endDate];
            }
        }

        // 查询每个模型的OCR识别数量
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

        const results = await MySQLHelper.query(query, params);

        // 计算总计
        const totalQuery = `
            SELECT COUNT(*) as total_count
            FROM img_history
            ${whereClause}
        `;
        const totalResult = await MySQLHelper.query(totalQuery, params);

        res.json({
            data: results,
            totalCount: totalResult[0]?.total_count || 0,
            dateRange: startDate && endDate ? {
                start: startDate,
                end: endDate
            } : null
        });

    } catch (error) {
        console.error('获取模型OCR统计失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

/**
 * 获取综合统计信息
 * 包含每日、总计、模型统计的汇总数据
 */
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // 默认获取最近7天的数据
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultEndDate.getDate() - 6);

        const start = startDate || defaultStartDate.toISOString().split('T')[0];
        const end = endDate || defaultEndDate.toISOString().split('T')[0];

        // 生成完整的日期序列
        const generateDateSeries = (start, end) => {
            const dates = [];
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates;
        };

        // 并行获取所有统计信息
        const [dailyStats, totalStats, modelStats] = await Promise.all([
            // 每日统计
            MySQLHelper.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                    COUNT(*) as ocr_count
                FROM img_history 
                WHERE DATE_FORMAT(created_at, '%Y-%m-%d') BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
                ORDER BY date ASC
            `, [start, end]),

            // 总计统计
            MySQLHelper.query(`
                SELECT 
                    COUNT(*) as total_ocr_count,
                    COUNT(DISTINCT DATE(created_at)) as total_days,
                    MIN(created_at) as first_ocr_date,
                    MAX(created_at) as last_ocr_date
                FROM img_history
            `),

            // 模型统计
            MySQLHelper.query(`
                SELECT 
                    modelName as model_name,
                    COUNT(*) as ocr_count,
                    DATE_FORMAT(MIN(created_at), '%Y-%m-%d') as first_use_date,
                    DATE_FORMAT(MAX(created_at), '%Y-%m-%d') as last_use_date
                FROM img_history
                WHERE DATE_FORMAT(created_at, '%Y-%m-%d') BETWEEN ? AND ?
                GROUP BY modelName
                ORDER BY ocr_count DESC
            `, [start, end])
        ]);

        // 补全缺失的日期
        const dateSeries = generateDateSeries(start, end);
        const resultMap = {};
        if (Array.isArray(dailyStats)) {
            dailyStats.forEach(row => {
                resultMap[row.date] = parseInt(row.ocr_count);
            });
        }

        const completeDailyData = dateSeries.map(date => ({
            date: date,
            ocr_count: resultMap[date] || 0
        }));

        res.json({
            dailyStats: {
                data: completeDailyData,
                totalDays: completeDailyData.length,
                dateRange: { start, end }
            },
            totalStats: totalStats[0] || {
                total_ocr_count: 0,
                total_days: 0,
                first_ocr_date: null,
                last_ocr_date: null
            },
            modelStats: {
                data: modelStats,
                totalCount: modelStats.reduce((sum, item) => sum + item.ocr_count, 0)
            }
        });

    } catch (error) {
        console.error('获取综合统计失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

module.exports = router;