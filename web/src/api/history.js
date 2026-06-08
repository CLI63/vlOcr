import request from '@/utils/request'

const BASE_URL = '/api/history'

/**
 * 分页查询历史记录
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.limit - 每页条数，最大100
 * @param {string} params.imgUrl - 模糊匹配图片URL
 * @param {string} params.fileMd5 - 精确匹配文件MD5
 * @param {string} params.modelName - 精确匹配模型名称
 * @returns {Promise} 返回历史记录列表
 */
export function getHistoryList(params) {
  return request({
    url: BASE_URL,
    method: 'get',
    params
  })
}

export function getHistoryDetail(id) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'get',
  })
}

/**
 * 删除历史记录
 * @param {string} fileMd5 - 文件MD5值
 * @returns {Promise} 返回删除结果
 */
export function deleteHistoryRecord(fileMd5) {
  return request({
    url: `${BASE_URL}/${fileMd5}`,
    method: 'delete'
  })
}
