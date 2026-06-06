import request from '@/utils/request'

/**
 * 测试token认证的接口
 * 用于验证登录后token是否正确携带
 * @returns {Promise} - 返回测试结果
 */
export function testTokenAuth() {
  return request({
    url: '/users/me',
    method: 'get',
  })
}
