import request from '@/utils/request'

const BASE_URL = '/api/models'

/**
 * 获取所有模型
 * @returns {Promise} - 返回模型列表
 */
export function getModels() {
  return request({
    url: BASE_URL,
    method: 'get',
  })
}

/**
 * 搜索模型
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} - 返回搜索结果
 */
export function searchModels(keyword) {
  return request({
    url: `${BASE_URL}/search/${encodeURIComponent(keyword)}`,
    method: 'get',
  })
}

/**
 * 创建模型
 * @param {Object} data - 模型数据
 * @returns {Promise} - 返回创建结果
 */
export function createModel(data) {
  return request({
    url: BASE_URL,
    method: 'post',
    data,
  })
}

/**
 * 更新模型
 * @param {string|number} id - 模型ID
 * @param {Object} data - 模型数据
 * @returns {Promise} - 返回更新结果
 */
export function updateModel(id, data) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除模型
 * @param {string|number} id - 模型ID
 * @returns {Promise} - 返回删除结果
 */
export function deleteModel(id) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'delete',
  })
}
