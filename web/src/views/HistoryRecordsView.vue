<template>
  <div class="history-records">
    <div class="header">
      <h1></h1>
      <div class="filters">
        <el-input
          v-model="searchForm.imgUrl"
          placeholder="图片URL关键词"
          style="width: 180px; margin-right: 10px"
          clearable
          @keyup.enter="searchRecords"
        />
        <el-input
          v-model="searchForm.fileMd5"
          placeholder="文件MD5"
          style="width: 180px; margin-right: 10px"
          clearable
          @keyup.enter="searchRecords"
        />
        <el-input
          v-model="searchForm.modelName"
          placeholder="模型名称"
          style="width: 180px; margin-right: 10px"
          clearable
          @keyup.enter="searchRecords"
        />
        <el-button type="primary" @click="searchRecords">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <div class="records-list">
      <el-card>
        <el-table
          :data="records"
          style="width: 100%"
          v-loading="loading"
          stripe
          :max-height="460"
          class="history-table"
        >
          <!-- <el-table-column prop="id" label="ID" width="80" /> -->
          <el-table-column label="图片" width="80">
            <template #default="{ row }">
              <el-image
                :src="row.imgUrl"
                :preview-src-list="[row.imgUrl]"
                style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px"
                fit="cover"
                :z-index="9999"
                :preview-teleported="true"
              >
                <template #error>
                  <div
                    style="
                      width: 50px;
                      height: 50px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background-color: #f5f7fa;
                      border-radius: 4px;
                    "
                  >
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </template>
          </el-table-column>
          <el-table-column prop="modelName" label="使用模型" width="120" show-overflow-tooltip />
          <el-table-column prop="updated_at" label="识别时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.updated_at || row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="imgUrl" label="源地址" width="200" show-overflow-tooltip />
          <el-table-column prop="ocrText" label="识别文本" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
                <el-button type="danger" size="small" @click="deleteRecord(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="识别详情" width="600px">
      <div v-if="selectedRecord">
        <el-row :gutter="20">
          <el-col>
            <el-input
              v-model="formattedOcrInfo"
              type="textarea"
              :rows="20"
              readonly
              placeholder="暂无OCR详细信息"
            />
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getHistoryList, deleteHistoryRecord } from '@/api/history'

defineOptions({
  name: 'HistoryRecordsView',
})

const searchForm = reactive({
  imgUrl: '',
  fileMd5: '',
  modelName: '',
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const records = ref([])
const showDetailDialog = ref(false)
const selectedRecord = ref(null)
const loading = ref(false)

const typeMap = {
  text: '文字识别',
  table: '表格识别',
  invoice: '票据识别',
  idcard: '身份证识别',
  bankcard: '银行卡识别',
  driverlicense: '驾驶证识别',
  vehiclelicense: '行驶证识别',
  businesslicense: '营业执照识别',
}

// 格式化OCR信息为JSON字符串
const formattedOcrInfo = computed(() => {
  if (!selectedRecord.value?.ocrInfo) {
    return ''
  }

  try {
    // 如果已经是对象，直接格式化
    if (typeof selectedRecord.value.ocrInfo === 'object') {
      return JSON.stringify(selectedRecord.value.ocrInfo, null, 2)
    }

    // 如果是字符串，尝试解析后格式化
    const parsed = JSON.parse(selectedRecord.value.ocrInfo)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    // 如果解析失败，返回原始字符串
    return String(selectedRecord.value.ocrInfo)
  }
})

// 加载历史记录
const loadHistoryRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm,
    }

    // 移除空值参数
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await getHistoryList(params)
    records.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索记录
const searchRecords = () => {
  currentPage.value = 1
  loadHistoryRecords()
}

// 重置搜索
const resetSearch = () => {
  searchForm.imgUrl = ''
  searchForm.fileMd5 = ''
  searchForm.modelName = ''
  searchRecords()
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  loadHistoryRecords()
}

// 每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadHistoryRecords()
}

// 查看详情
const viewDetail = (row) => {
  selectedRecord.value = row
  showDetailDialog.value = true
}

// 删除记录
const deleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteHistoryRecord(row.fileMd5)
    ElMessage.success('删除成功')
    loadHistoryRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

// 获取置信度样式类
const getConfidenceClass = (confidence) => {
  if (confidence >= 90) return 'high-confidence'
  if (confidence >= 70) return 'medium-confidence'
  return 'low-confidence'
}

// 获取置信度标签类型
const getConfidenceType = (confidence) => {
  if (confidence >= 90) return 'success'
  if (confidence >= 70) return 'warning'
  return 'danger'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 页面加载时获取数据
onMounted(() => {
  loadHistoryRecords()
})
</script>

<style scoped>
.history-records {
  padding: 20px;
  max-width: 100%;
  overflow-x: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.records-list {
  margin-bottom: 20px;
  width: 100%;
}

.records-list :deep(.el-card__body) {
  padding: 0;
}

.records-list :deep(.el-table) {
  border-radius: 4px;
  width: 100%;
}

.records-list :deep(.el-table__body-wrapper) {
  max-height: 600px;
  overflow-y: auto;
}

.records-list :deep(.el-table__cell) {
  padding: 8px 0;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.action-buttons .el-button {
  padding: 5px 8px;
  font-size: 12px;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

@media (max-width: 1200px) {
  .history-records {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header h1 {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .history-records {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header h1 {
    font-size: 18px;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .filters .el-input,
  .filters .el-button {
    width: 100%;
    margin: 5px 0;
  }

  .records-list {
    overflow-x: auto;
    margin-left: -10px;
    margin-right: -10px;
    padding: 0 10px;
  }

  .records-list :deep(.el-table) {
    min-width: 700px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }

  .action-buttons .el-button {
    padding: 4px 6px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .records-list :deep(.el-table) {
    min-width: 600px;
  }

  .records-list :deep(.el-table__cell) {
    padding: 6px 0;
    font-size: 12px;
  }
}

.result-content {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.high-confidence {
  color: #67c23a;
}

.medium-confidence {
  color: #e6a23c;
}

.low-confidence {
  color: #f56c6c;
}
</style>
