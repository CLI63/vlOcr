<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="login-banner">
          <div class="banner-content">
            <h1>OCR智能识别系统</h1>
            <p>高效、准确的文字识别解决方案</p>
            <div class="banner-features">
              <div class="feature-item">
                <el-icon><Document /></el-icon>
                <span>多模型支持</span>
              </div>
              <div class="feature-item">
                <el-icon><DataAnalysis /></el-icon>
                <span>数据分析</span>
              </div>
              <div class="feature-item">
                <el-icon><Histogram /></el-icon>
                <span>实时统计</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-container">
          <div class="login-header">
            <div class="login-logo">
              <el-icon class="logo-icon"><Monitor /></el-icon>
            </div>
            <h2>OCR后台管理系统</h2>
            <p>欢迎回来，请登录您的账号</p>
          </div>
          <el-form
            ref="loginFormRef"
            :model="form"
            :rules="rules"
            @submit.prevent="handleLogin"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <div class="login-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <a href="#" class="forgot-password">忘记密码?</a>
            </div>
            <el-button
              type="primary"
              native-type="submit"
              class="login-btn"
              :loading="loading.value"
              round
            >
              {{ loading.value ? '登录中...' : '登录' }}
            </el-button>
          </el-form>
          <div class="login-footer">
            <p>© {{ new Date().getFullYear() }} OCR管理系统 版权所有</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { Document, DataAnalysis, Histogram, Monitor, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref(null)
const form = reactive({
  username: '',
  password: '',
})
const loading = reactive({
  value: false,
})
const rememberMe = ref(false)

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) {
      return false
    }

    loading.value = true
    try {
      const response = await login({
        username: form.username,
        password: form.password,
      })

      // 根据API文档，成功登录会返回token和user信息
      if (response.token && response.user) {
        // 保存token到localStorage
        localStorage.setItem('token', response.token)
        // 保存用户信息
        localStorage.setItem('user', JSON.stringify(response.user))

        // 如果选择了记住我，可以设置一个更长的过期时间
        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true')
        }

        ElMessage({
          type: 'success',
          message: '登录成功',
          duration: 2000,
        })

        // 跳转到仪表板页面
        router.push('/dashboard/ocr-statistics')
      } else {
        // 处理API返回的错误信息
        ElMessage.error(response.error || '登录失败，请检查用户名和密码')
      }
    } catch (error) {
      console.error('登录错误:', error)

      // 更详细的错误处理
      if (error.response) {
        // 服务器返回了错误状态码
        const { status, data } = error.response
        if (status === 401) {
          ElMessage.error('用户名或密码错误')
        } else if (status === 400) {
          ElMessage.error(data.error || '请求参数错误')
        } else {
          ElMessage.error(data.error || '服务器错误')
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        ElMessage.error('无法连接到服务器，请确保API服务器正在运行')
      } else {
        // 其他错误
        ElMessage.error('登录失败，请检查网络连接')
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-layout);
  overflow: hidden;
}

.login-content {
  display: flex;
  width: 80%;
  max-width: 1200px;
  height: 80vh;
  max-height: 700px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-active) 100%);
  display: none;
}

.login-banner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: var(--spacing-xl);
}

.banner-content {
  max-width: 400px;
}

.banner-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
}

.banner-content p {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xl);
  opacity: 0.9;
}

.banner-features {
  margin-top: var(--spacing-xl);
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.feature-item .el-icon {
  margin-right: var(--spacing-md);
  font-size: var(--font-size-lg);
  background: rgba(255, 255, 255, 0.2);
  padding: var(--spacing-sm);
  border-radius: 50%;
}

.login-right {
  flex: 1;
  background-color: var(--bg-container);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form-container {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.logo-icon {
  font-size: 2rem;
  color: var(--primary-color);
  background-color: var(--primary-light);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-header h2 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.login-header p {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.login-form {
  margin-bottom: var(--spacing-xl);
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.forgot-password {
  color: var(--primary-color);
  font-size: var(--font-size-sm);
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: var(--font-size-md);
  font-weight: 500;
}

.login-footer {
  text-align: center;
  color: var(--text-light);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xl);
}

/* 响应式调整 */
@media (min-width: 768px) {
  .login-left {
    display: block;
  }
}

@media (max-width: 767px) {
  .login-content {
    width: 90%;
    height: auto;
  }

  .login-form-container {
    padding: var(--spacing-lg);
  }
}
</style>
