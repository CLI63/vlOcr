<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <!-- <template #header>
        <div class="card-header">
          <span>个人中心</span>
        </div>
      </template> -->

      <!-- 个人信息部分 -->
      <div class="profile-section">
        <h3>个人信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userInfo.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ userInfo.role || '用户' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{
            formatDate(userInfo.createdAt)
          }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 修改密码部分 -->
      <div class="profile-section">
        <h3>修改密码</h3>
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
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserInfo, changePassword } from '@/api/auth'

// 用户信息 - 使用ref而不是reactive，避免组件重新创建时重置
const userInfo = ref({
  username: '',
  email: '',
  role: '',
  createdAt: '',
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

    // 检查API返回的数据结构
    if (response && typeof response === 'object') {
      userInfo.value = { ...userInfo.value, ...response }
      // 更新localStorage中的用户信息
      localStorage.setItem('user', JSON.stringify(response))
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
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.profile-section {
  margin-bottom: 30px;
}

.profile-section h3 {
  margin-bottom: 20px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.password-form {
  max-width: 500px;
}

.el-descriptions {
  margin-bottom: 20px;
}
</style>
