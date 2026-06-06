<template>
  <div class="user-management-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><UserFilled /></el-icon>
        <h1>用户管理</h1>
      </div>
      <div class="page-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或邮箱"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
          class="search-input"
        />
        <el-button type="primary" @click="showAddUserDialog">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
    </div>

    <el-card class="user-management-card app-card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <el-tag type="info" effect="plain">共 {{ totalUsers }} 个用户</el-tag>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新" placement="top">
            <el-button circle @click="fetchUserList">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-dropdown trigger="click">
            <el-button circle>
              <el-icon><Setting /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-checkbox v-model="tableSettings.showEmail">显示邮箱</el-checkbox>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-checkbox v-model="tableSettings.showCreatedAt">显示创建时间</el-checkbox>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 用户列表 -->
      <el-table
        :data="filteredUserList"
        style="width: 100%"
        v-loading="loading"
        row-key="id"
        border
        stripe
        highlight-current-row
        @row-click="handleRowClick"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" sortable>
          <template #default="scope">
            <div class="user-name-cell">
              <el-avatar :size="32" :src="getUserAvatar(scope.row)" />
              <span>{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" v-if="tableSettings.showEmail" />
        <el-table-column
          prop="created_at"
          label="创建时间"
          sortable
          v-if="tableSettings.showCreatedAt"
        >
          <template #default="scope">
            <el-tooltip :content="formatFullDate(scope.row.created_at)" placement="top">
              {{ formatDate(scope.row.created_at) }}
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click.stop="showEditUserDialog(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click.stop="handleDeleteUser(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalUsers"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="userForm.status"
            active-value="active"
            inactive-value="disabled"
            active-text="正常"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitUser" :loading="submitLoading">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="用户详情" size="30%" direction="rtl">
      <div v-if="selectedUser" class="user-detail">
        <div class="user-detail-header">
          <el-avatar :size="80" :src="getUserAvatar(selectedUser)" />
          <h2>{{ selectedUser.username }}</h2>
          <p>{{ selectedUser.email }}</p>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{
            formatFullDate(selectedUser.created_at)
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedUser.status === 'active' ? 'success' : 'danger'">
              {{ selectedUser.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="user-detail-actions">
          <el-button type="primary" @click="showEditUserDialog(selectedUser)">编辑用户</el-button>
          <el-button type="danger" @click="handleDeleteUser(selectedUser)">删除用户</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, Setting, UserFilled } from '@element-plus/icons-vue'
import { register, updateUser, deleteUser, getUserList } from '@/api/auth'

// 用户列表数据
const userList = ref([])
const loading = ref(false)
const totalUsers = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchQuery = ref('')

// 表格设置
const tableSettings = reactive({
  showEmail: true,
  showCreatedAt: true,
})

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)

// 抽屉相关
const drawerVisible = ref(false)
const selectedUser = ref(null)

// 表单相关
const userFormRef = ref()
const userForm = reactive({
  id: '',
  username: '',
  email: '',
  password: '',
  status: 'active',
})

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

// 过滤后的用户列表
const filteredUserList = computed(() => {
  if (!searchQuery.value) {
    return userList.value
  }

  const query = searchQuery.value.toLowerCase()
  return userList.value.filter(
    (user) =>
      user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
  )
})

// 格式化日期 (简短版本)
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 格式化日期 (完整版本)
const formatFullDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 获取用户头像
const getUserAvatar = (user) => {
  // 这里可以根据用户信息生成头像，或者返回默认头像
  return `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const response = await getUserList()
    // 根据接口文档，响应格式为 { users: [...] }
    const users = response.users || []

    // 添加状态字段（实际项目中可能已经包含此字段）
    userList.value = users.map((user) => ({
      ...user,
      status: user.status || 'active', // 默认为激活状态
    }))

    totalUsers.value = userList.value.length
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 显示添加用户对话框
const showAddUserDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 显示编辑用户对话框
const showEditUserDialog = (user) => {
  isEdit.value = true
  Object.assign(userForm, {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status || 'active',
    password: '', // 编辑时不显示密码
  })
  dialogVisible.value = true

  // 如果抽屉是打开的，则关闭它
  if (drawerVisible.value) {
    drawerVisible.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(userForm, {
    id: '',
    username: '',
    email: '',
    password: '',
    status: 'active',
  })
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

// 处理提交用户表单
const handleSubmitUser = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          // 编辑用户
          await updateUser(userForm.id, {
            username: userForm.username,
            email: userForm.email,
            status: userForm.status,
          })
          ElMessage({
            type: 'success',
            message: '用户更新成功',
            duration: 2000,
          })
        } else {
          // 添加用户
          await register({
            username: userForm.username,
            email: userForm.email,
            password: userForm.password,
            status: userForm.status,
          })
          ElMessage({
            type: 'success',
            message: '用户添加成功',
            duration: 2000,
          })
        }

        dialogVisible.value = false
        fetchUserList() // 刷新用户列表
      } catch (error) {
        if (error.response?.data?.error) {
          ElMessage.error(error.response.data.error)
        } else {
          ElMessage.error(isEdit.value ? '用户更新失败' : '用户添加失败')
        }
      } finally {
        submitLoading.value = false
      }
    } else {
      ElMessage.error('请检查表单填写是否正确')
    }
  })
}

// 处理删除用户
const handleDeleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    try {
      await deleteUser(user.id)
      ElMessage({
        type: 'success',
        message: '用户删除成功',
        duration: 2000,
      })

      // 如果抽屉是打开的，则关闭它
      if (drawerVisible.value && selectedUser.value?.id === user.id) {
        drawerVisible.value = false
      }

      fetchUserList() // 刷新用户列表
    } catch (error) {
      if (error.response?.data?.error) {
        ElMessage.error(error.response.data.error)
      } else {
        ElMessage.error('用户删除失败')
      }
    }
  } catch {
    // 用户取消了删除操作
  }
}

// 处理行点击事件
const handleRowClick = (row) => {
  selectedUser.value = row
  drawerVisible.value = true
}

// 处理搜索
const handleSearch = () => {
  // 搜索是通过计算属性实现的，这里可以添加额外逻辑
  currentPage.value = 1 // 重置到第一页
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchUserList()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchUserList()
}

// 页面加载时获取用户列表
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-management-container {
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-icon {
  font-size: 24px;
  color: var(--primary-color);
  background-color: var(--primary-light);
  padding: var(--spacing-sm);
  border-radius: 50%;
}

.page-title h1 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.search-input {
  width: 240px;
}

.user-management-card {
  margin-bottom: var(--spacing-lg);
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.pagination-container {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.user-detail {
  padding: var(--spacing-md);
}

.user-detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.user-detail-header h2 {
  margin: var(--spacing-md) 0 var(--spacing-xs);
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.user-detail-header p {
  color: var(--text-secondary);
  margin: 0;
}

.user-detail-actions {
  margin-top: var(--spacing-xl);
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .page-actions {
    width: 100%;
  }

  .search-input {
    flex: 1;
  }
}
</style>
