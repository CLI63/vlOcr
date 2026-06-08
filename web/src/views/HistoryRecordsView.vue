<template>
  <div class="page-container history-records">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><DocumentCopy /></el-icon>
        <div>
          <h1>历史识别记录</h1>
          <p class="page-subtitle">按模型、来源与状态追踪识别档案，并进行导出与清理操作。</p>
        </div>
      </div>
      <div class="page-actions">
        <el-button :disabled="!selectedRows.length" @click="exportSelected('json')">导出 JSON</el-button>
        <el-button :disabled="!selectedRows.length" @click="exportSelected('txt')">导出 TXT</el-button>
        <el-button :disabled="!selectedRows.length" @click="exportSelected('csv')">导出 CSV</el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <el-card class="filter-card app-card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <el-tag type="info" effect="plain">已选 {{ selectedRows.length }} 条</el-tag>
          <el-tag type="success" effect="plain">总计 {{ total }} 条记录</el-tag>
        </div>
      </div>
      <div class="filters">
        <el-input v-model="searchForm.imgUrl" placeholder="图片URL关键词" clearable @keyup.enter="searchRecords" />
        <el-input v-model="searchForm.fileMd5" placeholder="文件MD5" clearable @keyup.enter="searchRecords" />
        <el-input v-model="searchForm.modelName" placeholder="模型名称" clearable @keyup.enter="searchRecords" />
        <el-select v-model="searchForm.status" clearable placeholder="状态">
          <el-option label="识别成功" value="success" />
          <el-option label="待校对" value="correcting" />
          <el-option label="已确认" value="confirmed" />
          <el-option label="失败" value="failed" />
        </el-select>
        <el-button type="primary" @click="searchRecords">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </el-card>

    <el-card class="records-card app-card">
      <el-table
        :data="records"
        v-loading="loading"
        stripe
        border
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image
              :src="row.imgUrl"
              :preview-src-list="[row.imgUrl]"
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px"
              fit="cover"
              :preview-teleported="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="使用模型" width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="plain">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sourceType" label="来源" width="120" />
        <el-table-column label="识别时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at || row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="imgUrl" label="源地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="ocrText" label="识别文本" min-width="260" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDetail(row)">查看</el-button>
            <el-button type="danger" size="small" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="showDetailDrawer" title="识别档案详情" size="55%">
      <div v-if="detailRecord" class="detail-shell">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模型">{{ detailRecord.modelName || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailRecord.status)" effect="plain">
              {{ getStatusLabel(detailRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件ID">{{ detailRecord.fileId || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="任务ID">{{ detailRecord.taskId || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ detailRecord.sourceType || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="识别时间">{{ formatDate(detailRecord.updated_at || detailRecord.created_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h3>识别文本</h3>
          <pre class="detail-pre">{{ detailRecord.ocrText || '暂无' }}</pre>
        </div>

        <div class="detail-section">
          <h3>结构化结果</h3>
          <pre class="detail-pre">{{ JSON.stringify(detailRecord.structuredJson || detailRecord.ocrInfo || {}, null, 2) }}</pre>
        </div>

        <div class="detail-section">
          <h3>校对结果</h3>
          <pre class="detail-pre">{{ JSON.stringify(detailRecord.correction?.correctedJson || detailRecord.correctedJson || {}, null, 2) }}</pre>
        </div>

        <div class="detail-section">
          <h3>模板信息</h3>
          <pre class="detail-pre">{{ JSON.stringify(detailRecord.template || {}, null, 2) }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import { deleteHistoryRecord, getHistoryDetail, getHistoryList } from '@/api/history'

defineOptions({
  name: 'HistoryRecordsView',
})

const searchForm = reactive({
  imgUrl: '',
  fileMd5: '',
  modelName: '',
  status: '',
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const records = ref([])
const selectedRows = ref([])
const showDetailDrawer = ref(false)
const detailRecord = ref(null)
const loading = ref(false)

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

function getStatusLabel(status) {
  const map = {
    success: '识别成功',
    correcting: '待校对',
    confirmed: '已确认',
    failed: '失败',
  }
  return map[status] || status || '未知'
}

function getStatusType(status) {
  if (status === 'success' || status === 'confirmed') return 'success'
  if (status === 'correcting') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
}

async function loadHistoryRecords() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm,
    }
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    const response = await getHistoryList(params)
    records.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

function searchRecords() {
  currentPage.value = 1
  loadHistoryRecords()
}

function resetSearch() {
  searchForm.imgUrl = ''
  searchForm.fileMd5 = ''
  searchForm.modelName = ''
  searchForm.status = ''
  searchRecords()
}

function handlePageChange(page) {
  currentPage.value = page
  loadHistoryRecords()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadHistoryRecords()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function openDetail(row) {
  const response = await getHistoryDetail(row.id)
  detailRecord.value = response.data || response
  showDetailDrawer.value = true
}

async function deleteRecord(row) {
  try {
    await ElMessageBox.confirm('确认删除该记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteHistoryRecord(row.fileMd5 || row.id)
    ElMessage.success('删除成功')
    loadHistoryRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除记录失败')
    }
  }
}

async function batchDelete() {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录吗？`, '批量删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    for (const row of selectedRows.value) {
      await deleteHistoryRecord(row.fileMd5 || row.id)
    }
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadHistoryRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportSelected(type) {
  if (!selectedRows.value.length) {
    return
  }

  if (type === 'json') {
    downloadBlob(JSON.stringify(selectedRows.value, null, 2), 'history-records.json', 'application/json;charset=utf-8')
    return
  }

  if (type === 'txt') {
    const text = selectedRows.value.map((item) => item.ocrText || '').join('\n\n')
    downloadBlob(text, 'history-records.txt', 'text/plain;charset=utf-8')
    return
  }

  const csv = [
    ['模型', '状态', '来源', '源地址', '识别文本'].join(','),
    ...selectedRows.value.map((item) =>
      [item.modelName, item.status, item.sourceType, item.imgUrl, (item.ocrText || '').replace(/,/g, '，')].join(',')
    ),
  ].join('\n')
  downloadBlob(csv, 'history-records.csv', 'text/csv;charset=utf-8')
}

onMounted(() => {
  loadHistoryRecords()
})
</script>

<style scoped>
.filters {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.filter-card,
.records-card {
  margin-bottom: var(--spacing-lg);
}

.card-toolbar {
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.toolbar-left {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  align-items: center;
}

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
