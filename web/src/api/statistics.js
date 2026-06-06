import request from '@/utils/request'

/**
 * 获取指定日期范围内的每日OCR识别数量
 * @param {string} startDate 开始日期，格式：YYYY-MM-DD
 * @param {string} endDate 结束日期，格式：YYYY-MM-DD
 * @returns {Promise} 返回每日统计数据
 */
export function getDailyOcrStats(startDate, endDate) {
  return request({
    url: '/api/statistics/daily-ocr',
    method: 'get',
    params: {
      startDate,
      endDate,
    },
  })
}

/**
 * 获取总计OCR识别数量统计信息
 * @returns {Promise} 返回总计统计数据
 */
export function getTotalOcrStats() {
  return request({
    url: '/api/statistics/total-ocr',
    method: 'get',
  })
}

/**
 * 获取每个模型的OCR识别数量统计
 * @param {string} startDate 开始日期，格式：YYYY-MM-DD (可选)
 * @param {string} endDate 结束日期，格式：YYYY-MM-DD (可选)
 * @returns {Promise} 返回模型统计数据
 */
export function getModelOcrStats(startDate, endDate) {
  return request({
    url: '/api/statistics/model-ocr',
    method: 'get',
    params: {
      startDate,
      endDate,
    },
  })
}

/**
 * 获取包含所有统计信息的综合数据
 * @param {string} startDate 开始日期，格式：YYYY-MM-DD (可选)
 * @param {string} endDate 结束日期，格式：YYYY-MM-DD (可选)
 * @returns {Promise} 返回综合统计数据
 */
export function getSummaryStats(startDate, endDate) {
  return request({
    url: '/api/statistics/summary',
    method: 'get',
    params: {
      startDate,
      endDate,
    },
  })
}
