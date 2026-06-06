import request from '@/utils/request'

/**
 * 上传单个文件
 * @param {FormData} formData - 包含文件的FormData
 * @returns {Promise} - 返回上传结果
 */
export function uploadFile(formData) {
  return request({
    url: '/api/upload/single',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 分类和OCR识别
 * @param {Object} data - 请求数据
 * @param {string} data.imageUrl - 图片URL
 * @returns {Promise} - 返回识别结果
 */
export function classifyOcr(data) {
  return request({
    url: '/classifyOcr',
    method: 'post',
    data,
  })
}

/**
 * OCR识别
 * @param {Object} data - 请求数据
 * @param {string} data.imageUrl - 图片URL
 * @returns {Promise} - 返回OCR结果
 */
export function ocr(data) {
  return request({
    url: '/ocr',
    method: 'post',
    data,
  })
}

/**
 * 分类识别
 * @param {Object} data - 请求数据
 * @param {string} data.imageUrl - 图片URL
 * @returns {Promise} - 返回分类结果
 */
export function classify(data) {
  return request({
    url: '/classify',
    method: 'post',
    data,
  })
}
