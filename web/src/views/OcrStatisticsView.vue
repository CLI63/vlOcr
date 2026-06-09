<template>
  <div class="page-container ocr-statistics-container">
    <div class="page-header">
      <div>
        <div class="page-title">
          <el-icon class="page-icon"><DataAnalysis /></el-icon>
          <div>
            <h1>OCR统计分析</h1>
            <p>从识别总量、日趋势和模型分布快速了解当前运行表现。</p>
          </div>
        </div>
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

    <section class="overview-metrics">
      <article class="metric-card metric-primary">
        <div class="metric-head">
          <span>总识别</span>
          <el-icon><Document /></el-icon>
        </div>
        <strong>{{ totalRecognitions }}</strong>
      </article>
      <article class="metric-card">
        <div class="metric-head">
          <span>今日</span>
          <el-icon><Calendar /></el-icon>
        </div>
        <strong>{{ todayRecognitions }}</strong>
      </article>
      <article class="metric-card">
        <div class="metric-head">
          <span>日均</span>
          <el-icon><TrendCharts /></el-icon>
        </div>
        <strong>{{ avgDailyRecognitions }}</strong>
      </article>
    </section>

    <section class="analytics-grid">
      <el-card class="trend-card">
        <template #header>
          <div class="card-header">
            <div>
              <span class="card-label">趋势</span>
              <strong>识别数量走势</strong>
            </div>
            <el-radio-group v-model="chartType" size="small" @change="updateChart">
              <el-radio-button label="line">折线</el-radio-button>
              <el-radio-button label="bar">柱状</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div class="chart-container" v-loading="loading">
          <canvas ref="lineChartRef"></canvas>
        </div>
      </el-card>

      <div class="analytics-side">
        <el-card class="distribution-card">
          <template #header>
            <div class="card-header">
              <div>
                <span class="card-label">分布</span>
                <strong>模型使用构成</strong>
              </div>
              <el-button text @click="showAllModels = true">
                <el-icon><View /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="distribution-shell" v-loading="loading">
            <canvas ref="pieChartRef"></canvas>
          </div>
        </el-card>

        <el-card class="ranking-card">
          <template #header>
            <div class="card-header">
              <div>
                <span class="card-label">排行</span>
                <strong>热门模型</strong>
              </div>
              <el-select v-model="topModelCount" size="small" class="ranking-select" @change="updateTopModelsTable">
                <el-option :value="3" label="Top 3" />
                <el-option :value="5" label="Top 5" />
                <el-option :value="10" label="Top 10" />
              </el-select>
            </div>
          </template>
          <div class="ranking-table" v-loading="loading">
            <el-table :data="topModels" stripe>
              <el-table-column prop="rank" label="排名" width="76" />
              <el-table-column prop="name" label="模型名称" />
              <el-table-column prop="count" label="次数" width="90" sortable />
              <el-table-column label="占比" width="138">
                <template #default="scope">
                  <el-progress
                    :percentage="getModelPercentage(scope.row.count)"
                    :color="getModelColor(scope.row.rank)"
                    :stroke-width="8"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </section>

    <el-dialog v-model="showAllModels" title="所有模型使用统计" width="70%">
      <el-table :data="allModels" height="400px" border>
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column prop="name" label="模型名称" />
        <el-table-column prop="count" label="识别次数" sortable />
        <el-table-column label="占比" width="180">
          <template #default="scope">
            <el-progress
              :percentage="getModelPercentage(scope.row.count)"
              :format="percentageFormat"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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

const lineChartRef = ref(null)
const pieChartRef = ref(null)
const totalRecognitions = ref(0)
const todayRecognitions = ref(0)
const avgDailyRecognitions = ref(0)
const topModels = ref([])
const allModels = ref([])
const loading = ref(true)

let trendChartInstance = null
let pieChartInstance = null

const chartType = ref('line')
const topModelCount = ref(5)
const showAllModels = ref(false)

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

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    fetchStatisticsData()
  }
}

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

const formatTrendChartData = (dailyStats) => {
  if (!dailyStats || dailyStats.length === 0) {
    return {
      labels: [],
      datasets: [
        {
          label: '识别数量',
          data: [],
          borderColor: '#2455d6',
          backgroundColor: 'rgba(36, 85, 214, 0.14)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#2455d6',
          pointRadius: 3,
          pointHoverRadius: 5,
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
        borderColor: '#2455d6',
        backgroundColor: 'rgba(36, 85, 214, 0.14)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2455d6',
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }
}

const formatPieChartData = (modelStats) => {
  if (!modelStats || modelStats.length === 0) {
    return {
      labels: [],
      datasets: [{ data: [], backgroundColor: [] }],
    }
  }

  const sorted = [...modelStats].sort((a, b) => b.ocr_count - a.ocr_count)
  const topFive = sorted.slice(0, 5)
  const otherModels = sorted.slice(5)
  const otherCount = otherModels.reduce((sum, model) => sum + model.ocr_count, 0)

  const labels = topFive.map((model) => model.model_name || '未知模型')
  const data = topFive.map((model) => model.ocr_count)

  if (otherCount > 0) {
    labels.push('其他')
    data.push(otherCount)
  }

  const backgroundColors = [
    'rgba(36, 85, 214, 0.88)',
    'rgba(15, 118, 110, 0.88)',
    'rgba(183, 121, 31, 0.88)',
    'rgba(121, 86, 184, 0.88)',
    'rgba(194, 65, 59, 0.88)',
    'rgba(110, 127, 153, 0.88)',
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

const getModelPercentage = (count) => {
  if (!totalRecognitions.value || totalRecognitions.value === 0) return 0
  return Math.round((count / totalRecognitions.value) * 100)
}

const percentageFormat = (percentage) => `${percentage}%`

const getModelColor = (rank) => {
  const colors = {
    1: '#2455d6',
    2: '#0f766e',
    3: '#b7791f',
  }
  return colors[rank] || '#6e7f99'
}

const createTrendChart = (chartData) => {
  if (!lineChartRef.value) return

  trendChartInstance = new Chart(lineChartRef.value, {
    type: chartType.value,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#6e7f99',
          },
          grid: {
            color: 'rgba(16, 35, 63, 0.08)',
          },
        },
        x: {
          ticks: {
            color: '#6e7f99',
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#10233f',
            boxWidth: 18,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    },
  })
}

const createPieChart = (pieChartData) => {
  if (!pieChartRef.value) return

  pieChartInstance = new Chart(pieChartRef.value, {
    type: 'doughnut',
    data: pieChartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 16,
            color: '#4b5d79',
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
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

const updateChart = () => {
  if (!trendChartInstance || !lineChartRef.value) return

  const chartData = trendChartInstance.data
  trendChartInstance.destroy()
  createTrendChart(chartData)
}

const updateTopModelsTable = () => {
  if (!allModels.value.length) return
  topModels.value = allModels.value.slice(0, topModelCount.value)
}

const fetchStatisticsData = async () => {
  loading.value = true
  const { startDate, endDate } = getDateRange()

  try {
    const response = await getSummaryStats(startDate, endDate)

    if (!response || !response.dailyStats || !response.totalStats || !response.modelStats) {
      ElMessage.error('获取统计数据失败，数据结构不正确')
      return
    }

    const { dailyStats, totalStats, modelStats } = response

    totalRecognitions.value = totalStats.total_ocr_count || 0

    const todayString = formatDate(new Date())
    const todayData = dailyStats.data.find((item) => item.date.includes(todayString))
    todayRecognitions.value = todayData ? todayData.ocr_count : 0

    const totalDays = dailyStats.data.length || 1
    const totalCount = dailyStats.data.reduce((sum, item) => sum + item.ocr_count, 0)
    avgDailyRecognitions.value = Math.round(totalCount / totalDays)

    allModels.value = modelStats.data
      .sort((a, b) => b.ocr_count - a.ocr_count)
      .map((model, index) => ({
        rank: index + 1,
        name: model.model_name || '未知模型',
        count: model.ocr_count,
      }))

    topModels.value = allModels.value.slice(0, topModelCount.value)

    const trendChartData = formatTrendChartData(dailyStats.data)
    if (trendChartInstance) {
      trendChartInstance.destroy()
    }
    createTrendChart(trendChartData)

    const pieChartData = formatPieChartData(modelStats.data)
    if (pieChartInstance) {
      pieChartInstance.destroy()
    }
    createPieChart(pieChartData)
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

onUnmounted(() => {
  if (trendChartInstance) {
    trendChartInstance.destroy()
    trendChartInstance = null
  }
  if (pieChartInstance) {
    pieChartInstance.destroy()
    pieChartInstance = null
  }
})
</script>

<style scoped>
.card-label {
  display: inline-flex;
  margin-bottom: 6px;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.overview-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  min-height: 98px;
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid rgba(23, 32, 51, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-xs);
}

.metric-primary {
  background: #172033;
  color: #ffffff;
  box-shadow: var(--shadow-xs);
}

.metric-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: inherit;
}

.metric-head span {
  font-size: 13px;
  color: inherit;
  opacity: 0.8;
}

.metric-head .el-icon {
  font-size: 18px;
}

.metric-card strong {
  font-size: 30px;
  line-height: 1.1;
  color: inherit;
}

.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.95fr);
  gap: 16px;
}

.analytics-side {
  display: grid;
  grid-template-rows: minmax(280px, 0.9fr) minmax(320px, 1fr);
  gap: 16px;
}

.trend-card,
.distribution-card,
.ranking-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-header strong {
  display: block;
  font-size: 16px;
  color: var(--text-primary);
}

.chart-container {
  height: 380px;
  position: relative;
}

.distribution-shell {
  height: 270px;
  position: relative;
}

.ranking-select {
  width: 112px;
}

.ranking-table {
  max-height: 360px;
  overflow: auto;
}
</style>
