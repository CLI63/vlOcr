<template>
  <div class="login-container">
    <section class="login-stage">
      <div class="login-brand">
        <div class="brand-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div>
          <strong>vlOcr</strong>
          <span>智能识别管理后台</span>
        </div>
      </div>

      <div class="login-panel">
          <div class="panel-mark">
            <div class="panel-logo">
              <el-icon><Monitor /></el-icon>
            </div>
            <div>
              <h2>欢迎登录</h2>
              <p>请输入你的后台账号信息</p>
            </div>
          </div>

          <el-form
            ref="loginFormRef"
            :model="form"
            :rules="rules"
            @submit.prevent="handleLogin"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名">
                <template #prepend>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password>
                <template #prepend>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <div class="login-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <button type="button" class="secondary-link">账号协助</button>
            </div>

            <el-button
              type="primary"
              native-type="submit"
              class="login-btn"
              :loading="loading.value"
            >
              {{ loading.value ? '正在登录' : '进入工作台' }}
            </el-button>
          </el-form>

          <div class="login-footnote">
            <small>© {{ new Date().getFullYear() }} OCR 管理系统</small>
          </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { Monitor, User, Lock } from '@element-plus/icons-vue'

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

      if (response.token && response.user) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true')
        }

        ElMessage({
          type: 'success',
          message: '登录成功',
          duration: 2000,
        })

        router.push('/dashboard/ocr-statistics')
      } else {
        ElMessage.error(response.error || '登录失败，请检查用户名和密码')
      }
    } catch (error) {
      console.error('登录错误:', error)

      if (error.response) {
        const { status, data } = error.response
        if (status === 401) {
          ElMessage.error('用户名或密码错误')
        } else if (status === 400) {
          ElMessage.error(data.error || '请求参数错误')
        } else {
          ElMessage.error(data.error || '服务器错误')
        }
      } else if (error.request) {
        ElMessage.error('无法连接到服务器，请确保API服务器正在运行')
      } else {
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
  min-height: 100vh;
  padding: 28px;
  background: #f4f6f9;
}

.login-stage {
  min-height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #172033;
  color: #ffffff;
  font-size: 20px;
}

.login-brand strong {
  display: block;
  font-size: 22px;
  line-height: 1.1;
}

.login-brand span {
  display: block;
  margin-top: 4px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.login-panel {
  width: min(100%, 430px);
  padding: 28px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid rgba(23, 32, 51, 0.08);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.panel-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.panel-logo {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef4ff;
  color: var(--primary-color);
  font-size: 20px;
  border: 1px solid rgba(37, 99, 235, 0.14);
}

.panel-mark h2 {
  margin: 0 0 4px;
  font-size: 22px;
  line-height: 1.15;
  color: var(--text-primary);
}

.panel-mark p {
  margin: 0;
  color: var(--text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.secondary-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--primary-color);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.login-btn {
  width: 100%;
  min-height: 42px;
  margin-top: 10px;
}

.login-footnote {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(23, 32, 51, 0.08);
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.login-footnote small {
  color: var(--text-tertiary);
}
</style>
