<template>
  <div class="page-container profile-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><User /></el-icon>
        <div>
          <h1>个人中心</h1>
          <p class="page-subtitle">查看当前账号信息，并维护登录密码与基础身份资料。</p>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <el-card class="profile-card profile-summary-card app-card">
        <div class="profile-summary">
          <el-avatar :size="72" class="profile-avatar">
            {{ (userInfo.username || 'U').slice(0, 1).toUpperCase() }}
          </el-avatar>
          <div>
            <h2>{{ userInfo.username || '未命名用户' }}</h2>
            <p>{{ userInfo.email || '未设置邮箱' }}</p>
          </div>
        </div>

        <div class="profile-meta">
          <div class="meta-item">
            <span>角色</span>
            <strong>{{ userInfo.role || '用户' }}</strong>
          </div>
          <div class="meta-item">
            <span>创建时间</span>
            <strong>{{ formatDate(userInfo.created_at || userInfo.createdAt) }}</strong>
          </div>
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userInfo.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ userInfo.role || '用户' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{
            formatDate(userInfo.created_at || userInfo.createdAt)
          }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="profile-card app-card">
        <div class="section-head">
          <div>
            <h3>修改密码</h3>
            <p>更新当前登录密码，建议使用长度更长的组合密码。</p>
          </div>
        </div>

        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-width="100px"
          class="password-form"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入当前密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              show-password
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleChangePassword">
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { getUserInfo, changePassword } from '@/api/auth'

// 用户信息 - 使用ref而不是reactive，避免组件重新创建时重置
const userInfo = ref({
  username: '',
  email: '',
  role: '',
  created_at: '',
})

// 从localStorage初始化用户信息
const initUserInfoFromStorage = () => {
  const localUser = localStorage.getItem('user')
  if (localUser) {
    try {
      const parsedUser = JSON.parse(localUser)
      userInfo.value = { ...userInfo.value, ...parsedUser }
      console.log('从localStorage初始化用户信息:', userInfo.value)
    } catch (error) {
      console.error('解析localStorage用户信息失败:', error)
    }
  }
}

// 密码表单
const passwordFormRef = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 加载状态
const loading = ref(false)

// 密码验证规则
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少需要6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    // 首先尝试从localStorage获取用户信息
    const localUser = localStorage.getItem('user')
    if (localUser) {
      const parsedUser = JSON.parse(localUser)
      userInfo.value = { ...userInfo.value, ...parsedUser }
      console.log('从localStorage获取用户信息:', parsedUser)
    }

    // 然后从API获取最新的用户信息
    const response = await getUserInfo()
    console.log('从API获取用户信息:', response)

    const apiUser = response?.user || response
    if (apiUser && typeof apiUser === 'object') {
      userInfo.value = { ...userInfo.value, ...apiUser }
      // 更新localStorage中的用户信息
      localStorage.setItem('user', JSON.stringify(apiUser))
      console.log('用户信息已更新:', userInfo.value)
    } else {
      console.warn('API返回的用户信息格式不正确:', response)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果API调用失败，但localStorage中有用户信息，则使用localStorage的数据
    const localUser = localStorage.getItem('user')
    if (localUser) {
      const parsedUser = JSON.parse(localUser)
      userInfo.value = { ...userInfo.value, ...parsedUser }
      console.log('API调用失败，使用localStorage中的用户信息:', parsedUser)
    } else {
      ElMessage.error('获取用户信息失败')
    }
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true
      try {
        await changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        })

        ElMessage.success('密码修改成功')

        // 清空表单
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''

        // 重置表单验证
        passwordFormRef.value.resetFields()
      } catch (error) {
        if (error.response?.data?.error) {
          ElMessage.error(error.response.data.error)
        } else {
          ElMessage.error('密码修改失败')
        }
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.error('请检查表单填写是否正确')
    }
  })
}

// 页面加载时获取用户信息
onMounted(() => {
  // 首先立即从localStorage初始化用户信息，避免页面闪烁
  initUserInfoFromStorage()
  // 然后异步获取最新用户信息
  fetchUserInfo()
})
</script>

<style scoped>
.profile-container {
  max-width: 1320px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: var(--spacing-lg);
}

.profile-card {
  min-height: 100%;
}

.profile-summary-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.profile-avatar {
  background: linear-gradient(180deg, #2d61e4 0%, #1f4cc3 100%);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.profile-summary h2 {
  margin: 0 0 6px;
  font-size: 24px;
  color: var(--text-primary);
}

.profile-summary p {
  margin: 0;
  color: var(--text-secondary);
}

.profile-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
}

.meta-item {
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 254, 0.94) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid rgba(16, 35, 63, 0.08);
}

.meta-item span {
  display: block;
  margin-bottom: 8px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.meta-item strong {
  color: var(--text-primary);
}

.section-head {
  margin-bottom: var(--spacing-lg);
}

.section-head h3 {
  margin: 0 0 6px;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.section-head p {
  margin: 0;
  color: var(--text-secondary);
}

.password-form {
  max-width: 580px;
}

@media (max-width: 1024px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
