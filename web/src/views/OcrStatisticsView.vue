<template>
  <div class="ocr-statistics-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><DataAnalysis /></el-icon>
        <h1>OCR统计分析</h1>
      </div>
      <div class="page-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" @click="fetchStatisticsData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stats-card app-card" shadow="hover">
          <div class="stats-card-content">
            <div class="stats-icon total-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-title">总识别数量</div>
              <div class="stats-value" v-loading="loading">{{ totalRecognitions }}</div>
              <div class="stats-desc">所有时间内的OCR识别总量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stats-card app-card" shadow="hover">
          <div class="stats-card-content">
            <div class="stats-icon today-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-title">今日识别数量</div>
              <div class="stats-value" v-loading="loading">{{ todayRecognitions }}</div>
              <div class="stats-desc">今日完成的OCR识别量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stats-card app-card" shadow="hover">
          <div class="stats-card-content">
            <div class="stats-icon avg-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-title">日均识别数量</div>
              <div class="stats-value" v-loading="loading">{{ avgDailyRecognitions }}</div>
              <div class="stats-desc">所选时间段内的日均识别量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card app-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>识别数量趋势</span>
              <div class="chart-actions">
                <el-radio-group v-model="chartType" size="small" @change="updateChart">
                  <el-radio-button label="line">折线图</el-radio-button>
                  <el-radio-button label="bar">柱状图</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div class="chart-container" v-loading="loading">
            <canvas ref="lineChartRef"></canvas>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模型分析和详细数据 -->
    <el-row :gutter="20" class="detail-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card class="model-card app-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>模型使用分布</span>
              <el-tooltip content="查看所有模型" placement="top">
                <el-button type="text" @click="showAllModels = true">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
          <div
            class="model-chart-container"
            style="width: 300px; margin: 0 auto; margin-top: -40px"
            v-loading="loading"
          >
            <canvas ref="pieChartRef"></canvas>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card class="top-models-card app-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门模型排行</span>
              <el-select
                style="width: 100px"
                v-model="topModelCount"
                size="small"
                @change="updateTopModelsTable"
              >
                <el-option :value="3" label="Top 3" />
                <el-option :value="5" label="Top 5" />
                <el-option :value="10" label="Top 10" />
              </el-select>
            </div>
          </template>
          <div class="top-models-content" v-loading="loading">
            <el-table :data="topModels" style="width: 100%" stripe>
              <el-table-column prop="rank" label="排名" width="80" />
              <el-table-column prop="name" label="模型名称" />
              <el-table-column prop="count" label="识别次数" sortable />
              <el-table-column label="占比" width="120">
                <template #default="scope">
                  <el-progress
                    :percentage="getModelPercentage(scope.row.count)"
                    :color="getModelColor(scope.row.rank)"
                    :stroke-width="10"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 所有模型对话框 -->
    <el-dialog v-model="showAllModels" title="所有模型使用统计" width="70%">
      <el-table :data="allModels" style="width: 100%" height="400px" border>
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column prop="name" label="模型名称" />
        <el-table-column prop="count" label="识别次数" sortable />
        <el-table-column label="占比" width="180">
          <template #default="scope">
            <el-progress
              :percentage="getModelPercentage(scope.row.count)"
              :format="percentageFormat"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { getSummaryStats } from '@/api/statistics'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Refresh,
  Document,
  Calendar,
  TrendCharts,
  View,
} from '@element-plus/icons-vue'

Chart.register(...registerables)

// 图表引用
const lineChartRef = ref(null)
const pieChartRef = ref(null)

// 数据状态
const totalRecognitions = ref(0)
const todayRecognitions = ref(0)
const avgDailyRecognitions = ref(0)
const topModels = ref([])
const allModels = ref([])
const loading = ref(true)

// 图表实例
let trendChartInstance = null
let pieChartInstance = null

// 图表类型和设置
const chartType = ref('line')
const topModelCount = ref(5)
const showAllModels = ref(false)

// 日期范围
const today = new Date()
const lastWeekStart = new Date()
lastWeekStart.setDate(today.getDate() - 6)

const dateRange = ref([lastWeekStart, today])
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      return [start, end]
    },
  },
]

// 格式化日期
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    fetchStatisticsData()
  }
}

// 获取日期范围
const getDateRange = () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
    }
  }

  return {
    startDate: formatDate(dateRange.value[0]),
    endDate: formatDate(dateRange.value[1]),
  }
}

// 格式化趋势图表数据
const formatTrendChartData = (dailyStats) => {
  if (!dailyStats || dailyStats.length === 0) {
    return {
      labels: [],
      datasets: [
        {
          label: '识别数量',
          data: [],
          borderColor: 'var(--primary-color)',
          backgroundColor: 'rgba(22, 119, 255, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'var(--primary-color)',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  }

  const labels = dailyStats.map((item) => {
    const date = new Date(item.date)
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const data = dailyStats.map((item) => item.ocr_count)

  return {
    labels,
    datasets: [
      {
        label: '识别数量',
        data,
        borderColor: 'var(--primary-color)',
        backgroundColor: 'rgba(22, 119, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'var(--primary-color)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
}

// 格式化饼图数据
const formatPieChartData = (modelStats) => {
  if (!modelStats || modelStats.length === 0) {
    return {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    }
  }

  // 取前5个模型，其余归为"其他"
  const topFive = modelStats.sort((a, b) => b.ocr_count - a.ocr_count).slice(0, 5)
  const otherModels = modelStats.slice(5)

  const otherCount = otherModels.reduce((sum, model) => sum + model.ocr_count, 0)

  const labels = topFive.map((model) => model.model_name || '未知模型')
  const data = topFive.map((model) => model.ocr_count)

  // 如果有"其他"类别，添加到数据中
  if (otherCount > 0) {
    labels.push('其他')
    data.push(otherCount)
  }

  // 饼图颜色
  const backgroundColors = [
    'rgba(22, 119, 255, 0.8)',
    'rgba(82, 196, 26, 0.8)',
    'rgba(250, 173, 20, 0.8)',
    'rgba(255, 77, 79, 0.8)',
    'rgba(47, 84, 235, 0.8)',
    'rgba(144, 147, 153, 0.8)',
  ]

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }
}

// 格式化模型数据
const formatModelData = (modelStats, limit = 3) => {
  if (!modelStats || modelStats.length === 0) {
    return []
  }

  return modelStats
    .sort((a, b) => b.ocr_count - a.ocr_count)
    .slice(0, limit)
    .map((model, index) => ({
      rank: index + 1,
      name: model.model_name || '未知模型',
      count: model.ocr_count,
    }))
}

// 获取模型占比百分比
const getModelPercentage = (count) => {
  if (!totalRecognitions.value || totalRecognitions.value === 0) return 0
  return Math.round((count / totalRecognitions.value) * 100)
}

// 百分比格式化
const percentageFormat = (percentage) => {
  return `${percentage}%`
}

// 获取模型颜色
const getModelColor = (rank) => {
  const colors = {
    1: '#f56c6c', // 第一名：红色
    2: '#e6a23c', // 第二名：橙色
    3: '#67c23a', // 第三名：绿色
  }
  return colors[rank] || '#409eff'
}

// 更新图表类型
const updateChart = () => {
  if (!trendChartInstance || !lineChartRef.value) return

  trendChartInstance.destroy()

  // 获取当前数据
  const chartData = trendChartInstance.data

  // 创建新图表
  trendChartInstance = new Chart(lineChartRef.value, {
    type: chartType.value,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    },
  })
}

// 更新Top模型表格
const updateTopModelsTable = () => {
  if (!allModels.value.length) return

  topModels.value = allModels.value.slice(0, topModelCount.value)
}

// 获取统计数据
const fetchStatisticsData = async () => {
  loading.value = true
  const { startDate, endDate } = getDateRange()

  try {
    const response = await getSummaryStats(startDate, endDate)

    // 确保数据存在
    if (!response || !response.dailyStats || !response.totalStats || !response.modelStats) {
      ElMessage.error('获取统计数据失败，数据结构不正确')
      return
    }

    // 解构数据
    const { dailyStats, totalStats, modelStats } = response

    // 更新总计识别数量
    totalRecognitions.value = totalStats.total_ocr_count || 0

    // 计算今日识别数量（如果有今日数据）
    const todayString = formatDate(new Date())
    const todayData = dailyStats.data.find((item) => item.date.includes(todayString))
    todayRecognitions.value = todayData ? todayData.ocr_count : 0

    // 计算日均识别数量
    const totalDays = dailyStats.data.length || 1
    const totalCount = dailyStats.data.reduce((sum, item) => sum + item.ocr_count, 0)
    avgDailyRecognitions.value = Math.round(totalCount / totalDays)

    // 更新所有模型数据
    allModels.value = modelStats.data
      .sort((a, b) => b.ocr_count - a.ocr_count)
      .map((model, index) => ({
        rank: index + 1,
        name: model.model_name || '未知模型',
        count: model.ocr_count,
      }))

    // 更新前N个模型
    topModels.value = allModels.value.slice(0, topModelCount.value)

    // 更新趋势图表
    const trendChartData = formatTrendChartData(dailyStats.data)

    if (trendChartInstance) {
      trendChartInstance.destroy()
    }

    if (lineChartRef.value) {
      trendChartInstance = new Chart(lineChartRef.value, {
        type: chartType.value,
        data: trendChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
        },
      })
    }

    // 更新饼图
    const pieChartData = formatPieChartData(modelStats.data)

    if (pieChartInstance) {
      pieChartInstance.destroy()
    }

    if (pieChartRef.value) {
      pieChartInstance = new Chart(pieChartRef.value, {
        type: 'pie',
        data: pieChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || ''
                  const value = context.raw || 0
                  const percentage = getModelPercentage(value)
                  return `${label}: ${value} (${percentage}%)`
                },
              },
            },
          },
        },
      })
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatisticsData()
})
</script>

<style scoped>
.ocr-statistics-container {
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

/* 数据概览卡片 */
.stats-overview {
  margin-bottom: var(--spacing-lg);
}

.stats-card {
  height: 140px;
  margin-bottom: var(--spacing-md);
  transition: transform var(--transition-fast);
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stats-card-content {
  height: 100%;
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-lg);
  font-size: 24px;
}

.total-icon {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.today-icon {
  background-color: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.avg-icon {
  background-color: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.stats-info {
  flex: 1;
}

.stats-title {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.stats-desc {
  font-size: var(--font-size-sm);
  color: var(--text-light);
}

/* 图表样式 */
.chart-row {
  margin-bottom: var(--spacing-lg);
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.chart-actions {
  display: flex;
  align-items: center;
}

/* 详细数据行 */
.detail-row {
  margin-bottom: var(--spacing-lg);
}

.model-card {
  height: 400px;
}

.model-chart-container {
  height: 320px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-models-card {
  height: 400px;
}

.top-models-content {
  height: 320px;
  overflow-y: auto;
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
    flex-direction: column;
    align-items: stretch;
  }

  .stats-card {
    margin-bottom: var(--spacing-md);
  }

  .chart-card,
  .model-card,
  .top-models-card {
    height: auto;
    margin-bottom: var(--spacing-lg);
  }

  .chart-container,
  .model-chart-container {
    height: 250px;
  }
}
</style>
