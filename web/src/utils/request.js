import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 60000,
})

function clearAuthAndRedirect() {
  ElMessage.error('认证失败，请重新登录')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  if (window.location.pathname !== '/login') {
    router.push('/login')
  }
}

function isTokenError(errorMsg = '') {
  const normalized = errorMsg.toLowerCase()
  return [
    '无效的访问令牌',
    'token已过期',
    'token无效',
    '认证失败',
    '未授权',
    'unauthorized',
    'invalid token',
    'token expired',
  ].some((msg) => normalized.includes(msg.toLowerCase()))
}

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-new-token']
    if (newToken) {
      localStorage.setItem('token', newToken)
    }

    const { data } = response
    if (data?.error) {
      if (isTokenError(data.error)) {
        clearAuthAndRedirect()
      } else {
        ElMessage.error(data.error || '请求失败')
      }
      return Promise.reject(new Error(data.error || '请求失败'))
    }

    return data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const errorMessage = data?.error || data?.message || error.message || '网络错误'

      if (status === 401 || isTokenError(errorMessage)) {
        clearAuthAndRedirect()
      } else {
        ElMessage.error(errorMessage)
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  },
)

export default service
