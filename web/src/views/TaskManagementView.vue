<template>
  <div class="page-container task-management">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><Tickets /></el-icon>
        <div>
          <h1>批量任务</h1>
          <p class="page-subtitle">集中查看识别队列、执行进度与失败项重试状态。</p>
        </div>
      </div>
      <div class="page-actions">
        <el-button @click="loadTasks">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
        <el-button type="primary" @click="dialogVisible = true">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
    </div>

    <div class="overview-grid">
      <div class="overview-card surface-card">
        <span class="overview-label">任务总数</span>
        <strong>{{ total }}</strong>
        <small>当前分页统计</small>
      </div>
      <div class="overview-card surface-card">
        <span class="overview-label">进行中</span>
        <strong>{{ runningTaskCount }}</strong>
        <small>包含 pending / running</small>
      </div>
      <div class="overview-card surface-card">
        <span class="overview-label">已完成</span>
        <strong>{{ completedTaskCount }}</strong>
        <small>成功收口的任务</small>
      </div>
      <div class="overview-card surface-card">
        <span class="overview-label">失败项</span>
        <strong>{{ failedItemCount }}</strong>
        <small>待重试或人工处理</small>
      </div>
    </div>

    <el-card class="task-card app-card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <el-tag type="info" effect="plain">每页 {{ limit }} 条</el-tag>
          <el-tag type="success" effect="plain">已载入 {{ tasks.length }} 个任务</el-tag>
        </div>
      </div>

      <el-table :data="tasks" v-loading="loading" border stripe>
        <el-table-column prop="name" label="任务名称" min-width="220" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.status)" effect="plain">
              {{ getTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_count" label="总数" width="90" />
        <el-table-column prop="success_count" label="成功" width="90" />
        <el-table-column prop="failed_count" label="失败" width="90" />
        <el-table-column prop="created_at" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openTaskDetail(row)">详情</el-button>
            <el-button size="small" @click="retryFailed(row)" :disabled="row.failed_count === 0">重试失败项</el-button>
            <el-button size="small" type="danger" @click="cancelCurrentTask(row)" :disabled="row.status === 'cancelled'">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          @current-change="loadTasks"
          @size-change="loadTasks"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建批量任务" width="620px" destroy-on-close>
      <div class="dialog-intro">
        仅会将有效文件纳入任务队列，系统会自动跳过已失效的文件记录。
      </div>
      <el-form label-width="100px">
        <el-form-item label="选择文件">
          <el-select v-model="selectedFileIds" multiple filterable placeholder="请选择已上传文件">
            <el-option
              v-for="file in uploadFiles"
              :key="file.id"
              :label="file.originalName || file.filename"
              :value="file.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="指定模型">
          <el-select v-model="selectedModelId" clearable placeholder="留空则自动分类">
            <el-option v-for="model in modelOptions" :key="model.id" :label="model.modelName" :value="model.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="createTaskRecord">创建任务</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="任务详情" size="50%" @close="stopPolling">
      <div v-if="taskDetail" class="detail-shell">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">{{ taskDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getTaskStatusType(taskDetail.status)" effect="plain">
              {{ getTaskStatusLabel(taskDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总数">{{ taskDetail.total_count }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ taskDetail.success_count }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ taskDetail.failed_count }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(taskDetail.created_at) }}</el-descriptions-item>
        </el-descriptions>

        <el-table :data="taskDetail.items || []" border stripe class="detail-table">
          <el-table-column prop="file_id" label="文件ID" min-width="180" />
          <el-table-column prop="page_no" label="页码" width="90" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getTaskStatusType(row.status)" effect="plain">
                {{ getTaskStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="error_message" label="失败原因" min-width="220" show-overflow-tooltip />
          <el-table-column prop="history_id" label="历史记录" min-width="220" show-overflow-tooltip />
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Tickets } from '@element-plus/icons-vue'
import { getModels } from '@/api/models'
import { getTasks, createTask, getTaskDetail, retryTask, cancelTask } from '@/api/tasks'
import request from '@/utils/request'

defineOptions({
  name: 'TaskManagementView',
})

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const tasks = ref([])
const uploadFiles = ref([])
const modelOptions = ref([])
const selectedFileIds = ref([])
const selectedModelId = ref('')
const taskDetail = ref(null)
const page = ref(1)
const limit = ref(10)
const total = ref(0)
let pollTimer = null

const runningTaskCount = computed(() =>
  tasks.value.filter((task) => ['pending', 'running', 'processing'].includes(task.status)).length,
)
const completedTaskCount = computed(() =>
  tasks.value.filter((task) => ['completed', 'success', 'finished'].includes(task.status)).length,
)
const failedItemCount = computed(() =>
  tasks.value.reduce((sum, task) => sum + Number(task.failed_count || 0), 0),
)

async function loadUploadFiles() {
  const response = await request({
    url: '/api/upload/list',
    method: 'get',
  })
  uploadFiles.value = response.data || []
}

async function loadModels() {
  const response = await getModels()
  modelOptions.value = response.data || []
}

async function loadTasks() {
  loading.value = true
  try {
    const response = await getTasks({ page: page.value, limit: limit.value })
    tasks.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

async function createTaskRecord() {
  if (!selectedFileIds.value.length) {
    ElMessage.warning('请先选择文件')
    return
  }

  submitLoading.value = true
  try {
    const response = await createTask({
      fileIds: selectedFileIds.value,
      modelId: selectedModelId.value || '',
      autoClassify: !selectedModelId.value,
      pdfPageMode: 'all',
    })
    const skippedFileIds = response.data?.skippedFileIds || []
    if (skippedFileIds.length > 0) {
      ElMessage.warning(`任务已创建，已跳过 ${skippedFileIds.length} 个无效文件`)
    } else {
      ElMessage.success('任务创建成功')
    }
    dialogVisible.value = false
    selectedFileIds.value = []
    selectedModelId.value = ''
    await loadTasks()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '任务创建失败')
  } finally {
    submitLoading.value = false
  }
}

async function openTaskDetail(row) {
  detailVisible.value = true
  await refreshTaskDetail(row.id)
  startPolling(row.id)
}

async function refreshTaskDetail(id) {
  const response = await getTaskDetail(id)
  taskDetail.value = response.data
}

function formatDateTime(value) {
  if (!value) return '暂无'
  return new Date(value).toLocaleString('zh-CN')
}

function getTaskStatusLabel(status) {
  const map = {
    pending: '待处理',
    running: '进行中',
    processing: '处理中',
    success: '成功',
    completed: '已完成',
    finished: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }
  return map[status] || status || '未知'
}

function getTaskStatusType(status) {
  if (['success', 'completed', 'finished'].includes(status)) return 'success'
  if (['failed'].includes(status)) return 'danger'
  if (['cancelled'].includes(status)) return 'info'
  if (['running', 'processing'].includes(status)) return 'warning'
  return ''
}

function startPolling(id) {
  stopPolling()
  pollTimer = setInterval(async () => {
    await refreshTaskDetail(id)
    await loadTasks()
  }, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function retryFailed(row) {
  await retryTask(row.id)
  ElMessage.success('失败项已加入重试队列')
  await loadTasks()
  if (taskDetail.value?.id === row.id) {
    await refreshTaskDetail(row.id)
  }
}

async function cancelCurrentTask(row) {
  await cancelTask(row.id)
  ElMessage.success('任务已取消')
  await loadTasks()
  if (taskDetail.value?.id === row.id) {
    await refreshTaskDetail(row.id)
  }
}

onMounted(async () => {
  await Promise.all([loadTasks(), loadUploadFiles(), loadModels()])
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.task-card {
  margin-bottom: var(--spacing-lg);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.overview-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.overview-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.overview-card strong {
  font-size: 30px;
  line-height: 1;
  color: var(--text-primary);
}

.overview-card small {
  color: var(--text-tertiary);
}

.card-toolbar {
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.dialog-intro {
  margin-bottom: var(--spacing-lg);
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(36, 85, 214, 0.08) 0%, rgba(36, 85, 214, 0.03) 100%);
  color: var(--text-secondary);
}

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-table {
  margin-top: var(--spacing-xs);
}

@media (max-width: 1280px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
