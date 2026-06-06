import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 60000,
})
// import.meta.env.VITE_API_BASE_URL

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加token认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { data } = response
    console.log('响应拦截器 - URL:', response.config.url, '响应数据:', data)

    // 处理登录接口的特殊响应格式
    if (response.config.url === '/users/login') {
      console.log('登录接口响应，返回原始数据')
      return data
    }

    // 处理其他接口的错误响应
    if (data.error) {
      console.log('检测到错误响应:', data.error)
      // 检查是否是令牌相关的错误
      const tokenErrorMessages = [
        '无效的访问令牌',
        'token已过期',
        'token无效',
        '认证失败',
        '未授权',
        'unauthorized',
        'invalid token',
        'token expired',
      ]

      const isTokenError = tokenErrorMessages.some((msg) =>
        data.error.toLowerCase().includes(msg.toLowerCase()),
      )

      if (isTokenError) {
        ElMessage.error('认证失败，请重新登录')
        // 清除token并跳转到登录页，但避免在登录页面本身跳转
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          router.push('/login')
        }
        return Promise.reject(new Error(data.error || '认证失败'))
      } else {
        ElMessage.error(data.error || '请求失败')
        return Promise.reject(new Error(data.error || '请求失败'))
      }
    }

    // 对于用户信息接口，确保返回正确的数据结构
    if (response.config.url === '/users/me') {
      console.log('用户信息接口响应，检查数据结构:', data)
      // 如果API返回的数据结构不包含必要的字段，但data本身存在，则返回data
      if (data && typeof data === 'object') {
        return data
      }
    }

    return data
  },
  (error) => {
    console.error('Response error:', error)
    if (error.response) {
      const { status, data } = error.response

      // 统一的令牌错误检测函数
      const checkTokenError = (errorMsg) => {
        const tokenErrorMessages = [
          '无效的访问令牌',
          'token已过期',
          'token无效',
          '认证失败',
          '未授权',
          'unauthorized',
          'invalid token',
          'token expired',
          '权限不足',
          'forbidden',
        ]
        return tokenErrorMessages.some((msg) => errorMsg.toLowerCase().includes(msg.toLowerCase()))
      }

      // 统一的令牌错误处理函数
      const handleTokenError = () => {
        ElMessage.error('认证失败，请重新登录')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          router.push('/login')
        }
      }

      switch (status) {
        case 401:
          handleTokenError()
          break
        case 403:
          const errorMessage403 = data.error || '权限不足'
          if (checkTokenError(errorMessage403)) {
            handleTokenError()
          } else {
            ElMessage.error(errorMessage403)
          }
          break
        default:
          const errorMessageDefault = data.error || error.message || '网络错误'
          if (checkTokenError(errorMessageDefault)) {
            handleTokenError()
          } else {
            ElMessage.error(errorMessageDefault)
          }
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  },
)

export default service
