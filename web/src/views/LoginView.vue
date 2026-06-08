<template>
  <div class="login-container">
    <div class="login-scene">
      <section class="login-stage">
        <div class="login-hero">
          <div class="hero-badge">OCR 管理后台</div>
          <h1>把识别、校对、统计和模型配置收进一个稳定的工作台。</h1>
          <p>
            面向日常业务流转设计，帮助团队持续追踪识别结果、批量任务和模型表现。
          </p>

          <div class="hero-grid">
            <div class="hero-card">
              <span>多模型识别</span>
              <strong>统一接入</strong>
            </div>
            <div class="hero-card">
              <span>历史归档</span>
              <strong>结构化追溯</strong>
            </div>
            <div class="hero-card">
              <span>批量任务</span>
              <strong>状态可见</strong>
            </div>
            <div class="hero-card">
              <span>统计分析</span>
              <strong>趋势与分布</strong>
            </div>
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
            <span>当前系统支持模型管理、模板配置、历史追溯与批量任务。</span>
            <small>© {{ new Date().getFullYear() }} OCR 管理系统</small>
          </div>
        </div>
      </section>
    </div>
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
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(36, 85, 214, 0.14), transparent 24%),
    radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.1), transparent 28%),
    linear-gradient(180deg, #eff4fa 0%, #e8eef6 100%);
}

.login-scene {
  min-height: calc(100vh - 48px);
  border-radius: 32px;
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.22) 100%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 26px 70px rgba(13, 27, 51, 0.08);
}

.login-stage {
  min-height: calc(100vh - 88px);
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(380px, 470px);
  gap: 24px;
}

.login-hero,
.login-panel {
  border-radius: 28px;
  overflow: hidden;
}

.login-hero {
  padding: 52px 56px;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.1), transparent 28%),
    linear-gradient(145deg, #122846 0%, #17375e 52%, #1c4271 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.login-hero::after {
  content: '';
  position: absolute;
  inset: auto 32px 32px auto;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 62%);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-hero h1 {
  max-width: 720px;
  margin: 28px 0 18px;
  font-size: clamp(42px, 4vw, 60px);
  line-height: 1.04;
  letter-spacing: 0;
}

.login-hero p {
  max-width: 560px;
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(240, 245, 253, 0.76);
}

.hero-grid {
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.hero-card {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.hero-card span {
  display: block;
  margin-bottom: 8px;
  color: rgba(240, 245, 253, 0.7);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-card strong {
  font-size: 18px;
  line-height: 1.3;
}

.login-panel {
  padding: 34px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, #ffffff 100%);
  border: 1px solid rgba(16, 35, 63, 0.08);
  box-shadow: 0 24px 56px rgba(16, 35, 63, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.panel-mark {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 34px;
}

.panel-logo {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eff4ff 0%, #dfe8fb 100%);
  color: var(--primary-color);
  font-size: 24px;
  border: 1px solid rgba(36, 85, 214, 0.14);
}

.panel-mark h2 {
  margin: 0 0 6px;
  font-size: 28px;
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
  min-height: 46px;
  margin-top: 10px;
}

.login-footnote {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(16, 35, 63, 0.08);
  color: var(--text-secondary);
  font-size: 13px;
}

.login-footnote small {
  color: var(--text-tertiary);
}
</style>
