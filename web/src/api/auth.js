import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} - 返回登录结果
 */
export function login(data) {
  return request({
    url: '/users/login',
    method: 'post',
    data,
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise} - 返回用户信息
 */
export function getUserInfo() {
  return request({
    url: '/users/me',
    method: 'get',
  })
}

/**
 * 修改用户密码
 * @param {Object} data - 密码数据
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} - 返回修改结果
 */
export function changePassword(data) {
  return request({
    url: '/users/change-password',
    method: 'post',
    data,
  })
}

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱
 * @returns {Promise} - 返回注册结果
 */
export function register(data) {
  return request({
    url: '/users/register',
    method: 'post',
    data,
  })
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {Object} data - 更新数据
 * @param {string} data.username - 用户名
 * @param {string} data.email - 邮箱
 * @returns {Promise} - 返回更新结果
 */
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise} - 返回删除结果
 */
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete',
  })
}

/**
 * 获取所有用户列表
 * @returns {Promise} - 返回用户列表
 */
export function getUserList() {
  return request({
    url: '/users',
    method: 'get',
  })
}
