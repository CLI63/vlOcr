<template>
  <div class="page-container model-management">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><Collection /></el-icon>
        <div>
          <h1>模型管理</h1>
          <p class="page-subtitle">维护识别模型、关键词策略与第三方视觉接口配置。</p>
        </div>
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
        <el-button v-if="isAdmin" @click="openProviderDialog">
          <el-icon><Setting /></el-icon>
          视觉接口配置
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          添加模型
        </el-button>
      </div>
    </div>

    <div class="model-overview">
      <div class="summary-card surface-card">
        <span>模型总数</span>
        <strong>{{ models.length }}</strong>
      </div>
      <div class="summary-card surface-card">
        <span>启用接口</span>
        <strong>{{ enabledProviders.length }}</strong>
      </div>
      <div class="summary-card surface-card">
        <span>模板数量</span>
        <strong>{{ templateOptions.length }}</strong>
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
                      <el-dropdown-item divided @click="deleteModelRecord(model)">
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
              <el-button type="danger" size="small" @click="deleteModelRecord(model)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && models.length === 0" description="暂无模型数据" :image-size="200">
        <el-button type="primary" @click="openAddDialog">添加模型</el-button>
      </el-empty>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>
    </div>

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
              <el-button type="danger" size="small" @click="deleteModelRecord(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

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
            <el-option
              v-for="item in availableProviderOptions"
              :key="item.id"
              :label="item.label"
              :value="item.value"
            />
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
        <el-form-item label="绑定模板">
          <el-select v-model="modelForm.templateId" clearable placeholder="请选择模板">
            <el-option
              v-for="item in templateOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
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

    <el-dialog
      v-model="providerDialogVisible"
      title="视觉接口配置"
      width="1100px"
      class="provider-config-dialog"
      destroy-on-close
    >
      <div class="provider-dialog-shell">
        <section class="provider-list-panel">
          <div class="provider-panel-header">
            <div>
              <h3>已配置接口</h3>
              <p>左侧查看和切换接口，右侧编辑当前配置。</p>
            </div>
            <el-button type="primary" @click="openCreateProviderForm">
              <el-icon><Plus /></el-icon>
              新增接口
            </el-button>
          </div>

          <div class="provider-list-summary">
            <span>共 {{ providerList.length }} 个接口</span>
            <span>启用 {{ enabledProviders.length }} 个</span>
          </div>

          <div class="provider-list" v-loading="providerLoading">
            <button
              v-for="provider in providerList"
              :key="provider.id"
              type="button"
              class="provider-list-item"
              :class="{ active: selectedProviderId === provider.id }"
              @click="editProvider(provider)"
            >
              <div class="provider-list-item-main">
                <div class="provider-list-item-title">
                  <strong>{{ provider.label }}</strong>
                  <el-tag size="small" :type="provider.enabled ? 'success' : 'info'">
                    {{ provider.enabled ? '启用中' : '已停用' }}
                  </el-tag>
                </div>
                <div class="provider-list-item-meta">
                  <span>{{ provider.value }}</span>
                  <span>{{ getProviderTypeLabel(provider.providerType) }}</span>
                  <span>排序 {{ provider.sortOrder }}</span>
                </div>
                <p class="provider-list-item-desc">
                  {{ provider.description || '暂无说明' }}
                </p>
              </div>
              <div class="provider-list-item-actions">
                <el-button size="small" @click.stop="editProvider(provider)">编辑</el-button>
                <el-button size="small" type="danger" @click.stop="deleteProviderRecord(provider)">删除</el-button>
              </div>
            </button>

            <el-empty
              v-if="!providerLoading && providerList.length === 0"
              description="还没有配置第三方视觉接口"
              :image-size="120"
            />
          </div>
        </section>

        <section class="provider-editor-panel">
          <div class="provider-editor-header">
            <div>
              <h3>{{ providerEditMode ? '编辑接口配置' : '新增接口配置' }}</h3>
              <p>{{ providerEditMode ? '更新当前接口的基础信息和状态。' : '创建新的第三方视觉模型接口选项。' }}</p>
            </div>
            <div class="provider-editor-badges">
              <el-tag v-if="providerEditMode" type="warning">编辑模式</el-tag>
              <el-tag v-else type="info">新建模式</el-tag>
            </div>
          </div>

          <el-form :model="providerForm" :rules="providerRules" ref="providerFormRef" label-width="96px">
            <div class="provider-form-grid">
              <el-form-item label="配置ID" prop="id">
                <el-input v-model="providerForm.id" :disabled="providerEditMode" placeholder="请输入配置ID" />
              </el-form-item>
              <el-form-item label="展示名称" prop="label">
                <el-input v-model="providerForm.label" placeholder="请输入展示名称" />
              </el-form-item>
              <el-form-item label="配置值" prop="value">
                <el-input v-model="providerForm.value" placeholder="例如 GLM-4.6V-Flash" />
              </el-form-item>
              <el-form-item label="接口类型" prop="providerType">
                <el-select v-model="providerForm.providerType" placeholder="请选择接口类型">
                  <el-option label="GLM" value="glm" />
                  <el-option label="Paddle" value="paddle" />
                </el-select>
              </el-form-item>
              <el-form-item label="排序" prop="sortOrder">
                <el-input-number v-model="providerForm.sortOrder" :min="0" :max="999" />
              </el-form-item>
              <el-form-item label="是否启用" prop="enabled">
                <div class="provider-switch-row">
                  <el-switch v-model="providerForm.enabled" />
                  <span class="provider-switch-text">{{ providerForm.enabled ? '当前允许被新建模型选择' : '当前仅保留历史模型使用' }}</span>
                </div>
              </el-form-item>
            </div>

            <el-form-item label="说明" prop="description">
              <el-input
                v-model="providerForm.description"
                type="textarea"
                :rows="5"
                placeholder="请输入说明"
              />
            </el-form-item>
          </el-form>

          <div class="provider-editor-footer">
            <el-button @click="resetProviderForm">重置</el-button>
            <el-button type="primary" :loading="providerSubmitLoading" @click="saveProvider">
              {{ providerEditMode ? '更新配置' : '创建配置' }}
            </el-button>
          </div>
        </section>
      </div>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="模型详情" size="30%" direction="rtl">
      <div v-if="selectedModel" class="model-detail">
        <h2 class="model-detail-title">{{ selectedModel.modelName }}</h2>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="模型ID">{{ selectedModel.id }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ selectedModel.description }}</el-descriptions-item>
        <el-descriptions-item label="API接口">{{ selectedModel.moreApi }}</el-descriptions-item>
        <el-descriptions-item label="提示信息">{{ selectedModel.glmTips }}</el-descriptions-item>
        <el-descriptions-item label="绑定模板">{{ selectedModel.templateName || '未绑定' }}</el-descriptions-item>
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
          <el-button type="danger" @click="deleteModelRecord(selectedModel)">删除模型</el-button>
        </div>

        <div class="model-version-block">
          <h3>版本记录</h3>
          <el-table :data="selectedModelVersions" size="small" border>
            <el-table-column prop="version" label="版本" width="90" />
            <el-table-column prop="change_note" label="变更说明" />
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
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
  Setting,
} from '@element-plus/icons-vue'
import {
  getModels,
  searchModels,
  createModel,
  updateModel,
  deleteModel as deleteModelApi,
  getVisionProviders,
  createVisionProvider,
  updateVisionProvider,
  deleteVisionProvider,
  getModelVersions,
} from '@/api/models'
import { getTemplates } from '@/api/templates'

defineOptions({
  name: 'ModelManagementView',
})

const DEFAULT_PROVIDER_VALUE = 'GLM-4.6V-Flash'

const viewMode = ref('card')
const showAddDialog = ref(false)
const drawerVisible = ref(false)
const providerDialogVisible = ref(false)
const selectedModel = ref(null)
const models = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const submitLoading = ref(false)
const providerLoading = ref(false)
const providerSubmitLoading = ref(false)
const providerList = ref([])
const templateOptions = ref([])
const selectedProviderId = ref('')
const selectedModelVersions = ref([])
const modelFormRef = ref(null)
const providerFormRef = ref(null)
const providerEditMode = ref(false)

const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
})

const isAdmin = computed(() => currentUser.value.role === 'admin')

const modelForm = reactive({
  id: '',
  modelName: '',
  description: '',
  keyWords: [],
  glmTips: '',
  moreApi: DEFAULT_PROVIDER_VALUE,
  templateId: '',
})

const providerForm = reactive({
  id: '',
  label: '',
  value: '',
  providerType: 'glm',
  description: '',
  enabled: true,
  sortOrder: 0,
})

const modelRules = {
  modelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, message: '模型名称至少2个字符', trigger: 'blur' },
  ],
  description: [{ required: true, message: '请输入模型描述', trigger: 'blur' }],
  moreApi: [{ required: true, message: '请选择API接口', trigger: 'change' }],
}

const providerRules = {
  id: [{ required: true, message: '请输入配置ID', trigger: 'blur' }],
  label: [{ required: true, message: '请输入展示名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  providerType: [{ required: true, message: '请选择接口类型', trigger: 'change' }],
}

const enabledProviders = computed(() => providerList.value.filter((item) => item.enabled))

const availableProviderOptions = computed(() => {
  const result = [...enabledProviders.value]
  if (
    modelForm.moreApi &&
    !result.some((item) => item.value === modelForm.moreApi)
  ) {
    const currentProvider = providerList.value.find((item) => item.value === modelForm.moreApi)
    if (currentProvider) {
      result.push(currentProvider)
    }
  }
  return result.sort((a, b) => a.sortOrder - b.sortOrder)
})

function getProviderTypeLabel(providerType) {
  return providerType === 'glm' ? 'GLM' : 'Paddle'
}

function getDefaultProviderValue() {
  if (enabledProviders.value.length === 0) {
    return ''
  }
  return [...enabledProviders.value].sort((a, b) => a.sortOrder - b.sortOrder)[0].value
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

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

const fetchProviders = async (includeDisabled = true) => {
  providerLoading.value = true
  try {
    const response = await getVisionProviders({ includeDisabled })
    providerList.value = response.data || []
    if (!modelForm.id && !modelForm.moreApi) {
      modelForm.moreApi = getDefaultProviderValue()
    }
  } catch (error) {
    console.error('获取视觉接口配置失败:', error)
    ElMessage.error('获取视觉接口配置失败')
  } finally {
    providerLoading.value = false
  }
}

const fetchTemplates = async () => {
  try {
    const response = await getTemplates()
    templateOptions.value = response.data || []
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

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

const viewModelDetails = (model) => {
  selectedModel.value = {
    ...model,
    templateName: templateOptions.value.find((item) => item.id === model.templateId)?.name || '',
  }
  drawerVisible.value = true
  loadModelVersions(model.id)
}

const openAddDialog = async () => {
  resetForm()
  showAddDialog.value = true
  await nextTick()
  modelFormRef.value?.clearValidate()
}

const editModel = (row) => {
  Object.assign(modelForm, {
    id: row.id,
    modelName: row.modelName,
    description: row.description,
    keyWords: JSON.parse(JSON.stringify(row.keyWords)),
    glmTips: row.glmTips,
    moreApi: row.moreApi,
    templateId: row.templateId || '',
  })
  showAddDialog.value = true
  nextTick(() => {
    modelFormRef.value?.clearValidate()
  })

  if (drawerVisible.value) {
    drawerVisible.value = false
  }
}

const deleteModelRecord = async (row) => {
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

const saveModel = async () => {
  if (!modelFormRef.value) return

  if (!availableProviderOptions.value.length) {
    ElMessage.error('当前没有可用的第三方视觉模型接口，请先配置')
    return
  }

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
        templateId: modelForm.templateId || null,
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
      const message = error?.response?.data?.message || '操作失败'
      ElMessage.error(message)
    } finally {
      submitLoading.value = false
    }
  })
}

const addKeyword = () => {
  modelForm.keyWords.push({ text: '', index: 2 })
}

const removeKeyword = (index) => {
  modelForm.keyWords.splice(index, 1)
}

const resetForm = () => {
  Object.assign(modelForm, {
    id: '',
    modelName: '',
    description: '',
    keyWords: [],
    glmTips: '',
    moreApi: getDefaultProviderValue(),
    templateId: '',
  })
  modelFormRef.value?.clearValidate()
}

const loadModelVersions = async (modelId) => {
  try {
    const response = await getModelVersions(modelId)
    selectedModelVersions.value = response.data || []
  } catch (error) {
    selectedModelVersions.value = []
  }
}

const handleDialogClose = () => {
  resetForm()
}

const openProviderDialog = async () => {
  providerDialogVisible.value = true
  await fetchProviders(true)
  if (providerList.value.length > 0) {
    editProvider(providerList.value[0])
  } else {
    resetProviderForm()
  }
}

const openCreateProviderForm = () => {
  resetProviderForm()
}

const editProvider = (provider) => {
  providerEditMode.value = true
  selectedProviderId.value = provider.id
  Object.assign(providerForm, {
    id: provider.id,
    label: provider.label,
    value: provider.value,
    providerType: provider.providerType,
    description: provider.description || '',
    enabled: Boolean(provider.enabled),
    sortOrder: provider.sortOrder || 0,
  })
}

const resetProviderForm = () => {
  providerEditMode.value = false
  selectedProviderId.value = ''
  Object.assign(providerForm, {
    id: '',
    label: '',
    value: '',
    providerType: 'glm',
    description: '',
    enabled: true,
    sortOrder: providerList.value.length,
  })
  if (providerFormRef.value) {
    providerFormRef.value.resetFields()
  }
}

const saveProvider = async () => {
  if (!providerFormRef.value) return

  await providerFormRef.value.validate(async (valid) => {
    if (!valid) {
      return false
    }

    providerSubmitLoading.value = true
    try {
      const payload = {
        id: providerForm.id,
        label: providerForm.label,
        value: providerForm.value,
        providerType: providerForm.providerType,
        description: providerForm.description,
        enabled: providerForm.enabled,
        sortOrder: providerForm.sortOrder,
      }

      if (providerEditMode.value) {
        await updateVisionProvider(providerForm.id, payload)
        ElMessage.success('视觉接口配置更新成功')
      } else {
        await createVisionProvider(payload)
        ElMessage.success('视觉接口配置创建成功')
      }

      await fetchProviders(true)
      const targetProvider = providerList.value.find((item) => item.id === payload.id)
      if (targetProvider) {
        editProvider(targetProvider)
      } else {
        resetProviderForm()
      }
    } catch (error) {
      console.error('保存视觉接口配置失败:', error)
      const message = error?.response?.data?.message || '保存视觉接口配置失败'
      ElMessage.error(message)
    } finally {
      providerSubmitLoading.value = false
    }
  })
}

const deleteProviderRecord = async (provider) => {
  try {
    await ElMessageBox.confirm(`确认删除视觉接口配置 "${provider.label}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteVisionProvider(provider.id)
    ElMessage.success('删除成功')
    await fetchProviders(true)
    if (providerList.value.length > 0) {
      editProvider(providerList.value[0])
    } else {
      resetProviderForm()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除视觉接口配置失败:', error)
      const message = error?.response?.data?.message || '删除视觉接口配置失败'
      ElMessage.error(message)
    }
  }
}

onMounted(async () => {
  await fetchProviders(true)
  await fetchTemplates()
  resetForm()
  fetchModels()
})
</script>

<style scoped>
.search-input {
  width: 240px;
}

.model-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.summary-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.summary-card strong {
  font-size: 28px;
  line-height: 1;
  color: var(--text-primary);
}

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

.model-table {
  margin-top: var(--spacing-lg);
}

.view-toggle {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

.loading-container {
  padding: var(--spacing-lg);
}

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

.provider-dialog-shell {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 20px;
  min-height: 620px;
}

.provider-list-panel,
.provider-editor-panel {
  background: linear-gradient(180deg, rgba(248, 250, 254, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid rgba(16, 35, 63, 0.08);
  border-radius: 18px;
  padding: 20px;
}

.provider-panel-header,
.provider-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.provider-panel-header h3,
.provider-editor-header h3 {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--text-primary);
}

.provider-panel-header p,
.provider-editor-header p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.provider-list-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

.provider-list-item {
  width: 100%;
  border: 1px solid #dbe3f0;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.provider-list-item:hover {
  border-color: #7aa2ff;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.08);
}

.provider-list-item.active {
  border-color: var(--primary-color);
  background: linear-gradient(180deg, #f7fbff 0%, #eef5ff 100%);
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.12);
}

.provider-list-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.provider-list-item-title strong {
  font-size: 18px;
  color: var(--text-primary);
}

.provider-list-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.provider-list-item-desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.provider-list-item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.provider-editor-badges {
  display: flex;
  align-items: center;
}

.provider-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.provider-switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.provider-switch-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.provider-editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .page-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input {
    flex: 1;
  }

  .model-card {
    margin-bottom: var(--spacing-md);
  }

  .model-overview {
    grid-template-columns: 1fr;
  }

  .provider-dialog-shell {
    grid-template-columns: 1fr;
  }

  .provider-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
