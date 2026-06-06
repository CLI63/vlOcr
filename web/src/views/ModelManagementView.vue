<template>
  <div class="model-management">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><Collection /></el-icon>
        <h1>模型管理</h1>
      </div>
      <div class="page-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模型名称或描述"
          prefix-icon="Search"
          clearable
          class="search-input"
          @keyup.enter="handleSearchModels"
        />
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加模型
        </el-button>
      </div>
    </div>

    <div class="model-cards" v-if="viewMode === 'card'">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="model in models" :key="model.id">
          <el-card class="model-card app-card" shadow="hover">
            <template #header>
              <div class="model-card-header">
                <h3 class="model-name">{{ model.modelName }}</h3>
                <el-dropdown trigger="click">
                  <el-button type="text">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="editModel(model)">
                        <el-icon><Edit /></el-icon> 编辑
                      </el-dropdown-item>
                      <el-dropdown-item @click="viewModelDetails(model)">
                        <el-icon><View /></el-icon> 查看详情
                      </el-dropdown-item>
                      <el-dropdown-item divided @click="deleteModel(model)">
                        <el-icon><Delete /></el-icon> 删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            <div class="model-content">
              <p class="model-description">{{ truncateText(model.description, 80) }}</p>
              <div class="model-api">
                <span class="label">API:</span>
                <el-tooltip :content="model.moreApi" placement="top">
                  <span class="api-text">{{ truncateText(model.moreApi, 30) }}</span>
                </el-tooltip>
              </div>
              <div class="model-keywords">
                <el-tag
                  v-for="keyword in model.keyWords.slice(0, 3)"
                  :key="keyword.index"
                  size="small"
                  effect="light"
                  class="keyword-tag"
                >
                  {{ keyword.text }}
                </el-tag>
                <el-tag v-if="model.keyWords.length > 3" size="small" type="info">
                  +{{ model.keyWords.length - 3 }}
                </el-tag>
              </div>
            </div>
            <div class="model-footer">
              <el-button type="primary" size="small" @click="editModel(model)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteModel(model)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="!loading && models.length === 0" description="暂无模型数据" :image-size="200">
        <el-button type="primary" @click="showAddDialog = true">添加模型</el-button>
      </el-empty>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <!-- 表格视图切换 -->
    <div class="view-toggle">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button label="card">
          <el-icon><Grid /></el-icon>
          卡片视图
        </el-radio-button>
        <el-radio-button label="table">
          <el-icon><List /></el-icon>
          表格视图
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="model-table">
      <el-card class="app-card">
        <el-table
          :data="models"
          style="width: 100%"
          v-loading="loading"
          border
          stripe
          highlight-current-row
        >
          <el-table-column prop="modelName" label="模型名称" sortable />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column prop="moreApi" label="API接口" show-overflow-tooltip />
          <el-table-column label="关键词" width="300">
            <template #default="{ row }">
              <el-tag
                v-for="keyword in row.keyWords.slice(0, 4)"
                :key="keyword.index"
                size="small"
                class="keyword-tag"
              >
                {{ keyword.text }}
              </el-tag>
              <span v-if="row.keyWords.length > 4">+{{ row.keyWords.length - 4 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editModel(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="deleteModel(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 添加/编辑模型对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="modelForm.id ? '编辑模型' : '添加模型'"
      width="600px"
      @close="handleDialogClose"
      destroy-on-close
    >
      <el-form :model="modelForm" :rules="modelRules" ref="modelFormRef" label-width="100px">
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="modelForm.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="modelForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入模型描述"
          />
        </el-form-item>
        <el-form-item label="API接口" prop="moreApi">
          <el-select v-model="modelForm.moreApi" placeholder="请选择API接口">
            <el-option v-for="item in moreApiOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="提示信息" prop="glmTips">
          <el-input
            v-model="modelForm.glmTips"
            type="textarea"
            :rows="3"
            placeholder="请输入提示信息"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <div class="keywords-container">
            <div v-for="(keyword, index) in modelForm.keyWords" :key="index" class="keyword-item">
              <el-input v-model="keyword.text" placeholder="关键词" class="keyword-input" />
              <el-input-number v-model="keyword.index" :min="1" :max="100" class="keyword-index" />
              <el-button type="danger" circle @click="removeKeyword(index)" class="keyword-delete">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <el-button type="primary" @click="addKeyword" class="add-keyword-btn">
            <el-icon><Plus /></el-icon>
            添加关键词
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveModel" :loading="submitLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 模型详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="模型详情" size="30%" direction="rtl">
      <div v-if="selectedModel" class="model-detail">
        <h2 class="model-detail-title">{{ selectedModel.modelName }}</h2>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="模型ID">{{ selectedModel.id }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ selectedModel.description }}</el-descriptions-item>
          <el-descriptions-item label="API接口">{{ selectedModel.moreApi }}</el-descriptions-item>
          <el-descriptions-item label="提示信息">{{ selectedModel.glmTips }}</el-descriptions-item>
        </el-descriptions>

        <div class="model-detail-keywords">
          <h3>关键词</h3>
          <div class="keywords-list">
            <el-tag
              v-for="keyword in selectedModel.keyWords"
              :key="keyword.index"
              class="keyword-tag"
            >
              {{ keyword.text }} ({{ keyword.index }})
            </el-tag>
          </div>
        </div>

        <div class="model-detail-actions">
          <el-button type="primary" @click="editModel(selectedModel)">编辑模型</el-button>
          <el-button type="danger" @click="deleteModel(selectedModel)">删除模型</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Plus,
  Edit,
  Delete,
  Search,
  MoreFilled,
  Grid,
  List,
  View,
} from '@element-plus/icons-vue'
import {
  getModels,
  searchModels,
  createModel,
  updateModel,
  deleteModel as deleteModelApi,
} from '@/api/models'

defineOptions({
  name: 'ModelManagementView',
})

// 视图模式
const viewMode = ref('card')

// 对话框和抽屉
const showAddDialog = ref(false)
const drawerVisible = ref(false)
const selectedModel = ref(null)

// 数据相关
const models = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const submitLoading = ref(false)

// 表单相关
const modelFormRef = ref(null)
const modelForm = reactive({
  id: '',
  modelName: '',
  description: '',
  keyWords: [],
  glmTips: '',
  moreApi: 'GLM-4.1V-Thinking-Flash',
})

const moreApiOptions = ref([
  { label: 'GLM-4.1V-Thinking-Flash', value: 'GLM-4.1V-Thinking-Flash' },
  { label: 'PaddleOCR-VL', value: 'PaddleOCR-VL' },
])

// 表单验证规则
const modelRules = {
  modelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, message: '模型名称至少2个字符', trigger: 'blur' },
  ],
  description: [{ required: true, message: '请输入模型描述', trigger: 'blur' }],
  moreApi: [{ required: true, message: '请输入API接口', trigger: 'blur' }],
}

// 文本截断函数
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 获取所有模型
const fetchModels = async () => {
  loading.value = true
  try {
    const response = await getModels()
    models.value = response.data || []
  } catch (error) {
    console.error('获取模型列表失败:', error)
    ElMessage({
      type: 'error',
      message: '获取模型列表失败',
      duration: 3000,
    })
  } finally {
    loading.value = false
  }
}

// 搜索模型
const handleSearchModels = async () => {
  if (!searchKeyword.value.trim()) {
    fetchModels()
    return
  }

  loading.value = true
  try {
    const response = await searchModels(searchKeyword.value)
    models.value = response.data || []
  } catch (error) {
    console.error('搜索模型失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

// 查看模型详情
const viewModelDetails = (model) => {
  selectedModel.value = model
  drawerVisible.value = true
}

// 编辑模型
const editModel = (row) => {
  Object.assign(modelForm, {
    id: row.id,
    modelName: row.modelName,
    description: row.description,
    keyWords: JSON.parse(JSON.stringify(row.keyWords)),
    glmTips: row.glmTips,
    moreApi: row.moreApi,
  })
  showAddDialog.value = true

  // 如果抽屉是打开的，则关闭它
  if (drawerVisible.value) {
    drawerVisible.value = false
  }
}

// 删除模型
const deleteModel = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除模型 "${row.modelName}" 吗？此操作不可撤销。`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteModelApi(row.id)
    ElMessage({
      type: 'success',
      message: '删除成功',
      duration: 2000,
    })

    // 如果抽屉是打开的且显示的是当前删除的模型，则关闭抽屉
    if (drawerVisible.value && selectedModel.value?.id === row.id) {
      drawerVisible.value = false
    }

    fetchModels()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模型失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存模型
const saveModel = async () => {
  if (!modelFormRef.value) return

  await modelFormRef.value.validate(async (valid) => {
    if (!valid) {
      return false
    }

    submitLoading.value = true
    try {
      const payload = {
        id: modelForm.id || String(Date.now()),
        modelName: modelForm.modelName,
        description: modelForm.description,
        keyWords: modelForm.keyWords,
        glmTips: modelForm.glmTips,
        moreApi: modelForm.moreApi,
      }

      if (modelForm.id) {
        await updateModel(modelForm.id, payload)
        ElMessage({
          type: 'success',
          message: '更新成功',
          duration: 2000,
        })
      } else {
        await createModel(payload)
        ElMessage({
          type: 'success',
          message: '创建成功',
          duration: 2000,
        })
      }

      showAddDialog.value = false
      resetForm()
      fetchModels()
    } catch (error) {
      console.error('保存模型失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 添加关键词
const addKeyword = () => {
  modelForm.keyWords.push({ text: '', index: 2 })
}

// 删除关键词
const removeKeyword = (index) => {
  modelForm.keyWords.splice(index, 1)
  // // 重新排序索引，确保按顺序为1、2、3...
  // modelForm.keyWords.forEach((keyword, idx) => {
  //   keyword.index = idx + 1
  // })
}

// 重置表单
const resetForm = () => {
  Object.assign(modelForm, {
    id: '',
    modelName: '',
    description: '',
    keyWords: [],
    glmTips: '',
    moreApi: 'GLM-4.1V-Thinking-Flash',
  })
  if (modelFormRef.value) {
    modelFormRef.value.resetFields()
  }
}

// 关闭对话框时重置表单
const handleDialogClose = () => {
  resetForm()
}

onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
.model-management {
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

/* 卡片视图样式 */
.model-cards {
  margin-bottom: var(--spacing-lg);
}

.model-card {
  height: 100%;
  margin-bottom: var(--spacing-lg);
  transition: transform var(--transition-fast);
}

.model-card:hover {
  transform: translateY(-5px);
}

.model-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-content {
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.model-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  flex: 1;
}

.model-api {
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.label {
  font-weight: 500;
  color: var(--text-primary);
}

.api-text {
  color: var(--text-secondary);
  font-family: monospace;
}

.model-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.keyword-tag {
  margin-right: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.model-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

/* 表格视图样式 */
.model-table {
  margin-top: var(--spacing-lg);
}

/* 视图切换 */
.view-toggle {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

/* 加载状态 */
.loading-container {
  padding: var(--spacing-lg);
}

/* 关键词表单样式 */
.keywords-container {
  margin-bottom: var(--spacing-md);
}

.keyword-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.keyword-input {
  flex: 1;
}

.keyword-index {
  width: 120px;
}

.add-keyword-btn {
  margin-top: var(--spacing-sm);
  width: auto;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 模型详情样式 */
.model-detail {
  padding: var(--spacing-md);
}

.model-detail-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.model-detail-keywords {
  margin-top: var(--spacing-lg);
}

.model-detail-keywords h3 {
  font-size: var(--font-size-md);
  font-weight: 500;
  margin-bottom: var(--spacing-md);
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.model-detail-actions {
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

  .model-card {
    margin-bottom: var(--spacing-md);
  }
}
</style>
