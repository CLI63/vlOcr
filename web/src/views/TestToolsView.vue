<template>
  <div class="page-container workspace">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><Document /></el-icon>
        <div>
          <h1>识别工作台</h1>
          <p class="page-subtitle">上传文件、触发识别、核对结构化结果，并完成模板校对闭环。</p>
        </div>
      </div>
      <div class="page-actions">
        <el-tag v-if="result.fromHistory" type="info" effect="plain">历史命中</el-tag>
        <el-button :disabled="busy" @click="resetWorkspace">
          <el-icon><RefreshLeft /></el-icon>
          重置工作台
        </el-button>
      </div>
    </div>

    <div class="workspace-grid">
      <section class="panel surface-card input-panel">
        <div class="panel-title">
          <div>
            <h2>文件与来源</h2>
            <p class="panel-subtitle">支持图片与 PDF，优先面向单次高质量识别流程。</p>
          </div>
          <el-tag effect="plain">{{ currentFile ? '已选文件' : '等待输入' }}</el-tag>
        </div>

        <el-upload
          class="upload-area"
          drag
          :action="uploadUrl"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-change="handleUploadChange"
          :show-file-list="false"
          accept="image/*,application/pdf,.pdf"
          name="file"
          :disabled="busy"
          :headers="uploadHeaders"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">拖拽或点击上传文件</div>
          <div class="upload-tip">JPG / PNG / JPEG / WEBP / PDF，最大 10MB</div>
        </el-upload>

        <div class="url-row">
          <el-input v-model="imageUrl" placeholder="或输入 HTTPS 图片 URL" clearable :disabled="busy">
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <el-button :disabled="busy || !imageUrl.trim()" @click="useUrlSource">使用</el-button>
        </div>

        <div class="preview-box">
          <template v-if="currentFile">
            <el-image
              v-if="isImageFile"
              :src="previewUrl"
              fit="contain"
              class="image-preview"
              :preview-src-list="[previewUrl]"
              :preview-teleported="true"
            />
            <div v-else class="pdf-preview">
              <el-icon><Document /></el-icon>
              <strong>{{ currentFile.originalName || 'PDF 文件' }}</strong>
              <span>PDF 预览将在多页识别版本中完善</span>
            </div>
            <div class="file-meta">
              <span>{{ currentFile.originalName || currentFile.url }}</span>
              <span v-if="currentFile.size">{{ formatSize(currentFile.size) }}</span>
            </div>
          </template>
          <el-empty v-else description="暂无文件" />
        </div>

        <el-button
          type="primary"
          class="recognize-button"
          :loading="recognizing"
          :disabled="!currentFile || busy"
          @click="startRecognition"
        >
          开始识别
        </el-button>
      </section>

      <section class="panel surface-card result-panel">
        <div class="panel-title">
          <div>
            <h2>识别结果</h2>
            <p class="panel-subtitle">从分类匹配到文本与 JSON 输出，统一在右侧工作区完成。</p>
          </div>
          <el-steps :active="activeStep" finish-status="success" simple class="status-steps">
            <el-step title="上传" />
            <el-step title="分类" />
            <el-step title="识别" />
            <el-step title="完成" />
          </el-steps>
        </div>

        <el-alert
          v-if="statusMessage"
          :title="statusMessage"
          :type="statusType"
          show-icon
          :closable="false"
          class="status-alert"
        />

        <div class="result-summary">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="最佳匹配">{{ result.bestMatch || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ recognitionTime ? `${recognitionTime} 秒` : '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="文件ID">{{ result.fileId || currentFile?.id || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="MD5">{{ result.fileMd5 || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="normalizedModels.length" class="models-list">
          <h3>匹配模型</h3>
          <el-table :data="normalizedModels" size="small" border>
            <el-table-column prop="modelName" label="模型" />
            <el-table-column label="关键词">
              <template #default="{ row }">
                {{ Array.isArray(row.keyWords) ? row.keyWords.join(', ') : '暂无' }}
              </template>
            </el-table-column>
            <el-table-column prop="score" label="权重" width="90" />
          </el-table>
        </div>

        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="识别文本" name="text">
            <pre class="result-content">{{ result.ocrText || '暂无结果' }}</pre>
          </el-tab-pane>
          <el-tab-pane label="结构化 JSON" name="json">
            <pre class="result-content">{{ formattedJson }}</pre>
          </el-tab-pane>
          <el-tab-pane label="模板校对" name="correction">
            <div v-if="templateFields.length" class="correction-form">
              <div v-for="field in templateFields" :key="field.key" class="correction-field">
                <label>{{ field.label }}</label>
                <el-input
                  v-if="field.type !== 'textarea'"
                  v-model="correctionForm[field.key]"
                  :placeholder="field.placeholder || field.label"
                />
                <el-input
                  v-else
                  v-model="correctionForm[field.key]"
                  type="textarea"
                  :rows="3"
                  :placeholder="field.placeholder || field.label"
                />
              </div>
              <div class="result-actions">
                <el-button type="primary" :disabled="!result.id && !result.fileId" @click="saveCorrectionRecord">
                  保存校对
                </el-button>
                <el-button :disabled="!correctionId" @click="confirmCorrectionRecord">确认结果</el-button>
              </div>
            </div>
            <el-empty v-else description="当前模型未绑定模板" />
          </el-tab-pane>
        </el-tabs>

        <div class="result-actions">
          <el-button :disabled="!hasResult" @click="copyText">
            <el-icon><DocumentCopy /></el-icon>
            复制文本
          </el-button>
          <el-button :disabled="!hasResult" @click="copyJson">
            <el-icon><DocumentCopy /></el-icon>
            复制 JSON
          </el-button>
          <el-button :disabled="!hasResult" @click="downloadText">
            <el-icon><Download /></el-icon>
            TXT
          </el-button>
          <el-button :disabled="!hasResult" @click="downloadJson">
            <el-icon><Download /></el-icon>
            JSON
          </el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  DocumentCopy,
  Download,
  Link,
  RefreshLeft,
  UploadFilled,
} from '@element-plus/icons-vue'
import { classifyOcr } from '@/api/test'
import { confirmCorrection, saveCorrection } from '@/api/corrections'

defineOptions({
  name: 'TestToolsView',
})

const uploadUrl = `${import.meta.env.VITE_FILE_API_BASE_URL}/api/upload/single`
const imageUrl = ref('')
const currentFile = ref(null)
const result = ref({})
const activeTab = ref('text')
const statusMessage = ref('')
const statusType = ref('info')
const activeStep = ref(0)
const uploading = ref(false)
const recognizing = ref(false)
const startTime = ref(0)
const recognitionTime = ref('')
const correctionId = ref('')
const correctionForm = reactive({})

const busy = computed(() => uploading.value || recognizing.value)
const hasResult = computed(() => Boolean(result.value.ocrText || Object.keys(result.value.ocrInfo || {}).length))
const isImageFile = computed(() => {
  const mimeType = currentFile.value?.mimeType || currentFile.value?.mimetype || ''
  return mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(currentFile.value?.url || '')
})
const previewUrl = computed(() => currentFile.value?.previewUrl || currentFile.value?.url || '')
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

const normalizedModels = computed(() => normalizeAllModel(result.value.allModel))
const formattedJson = computed(() => JSON.stringify(normalizeJson(result.value.ocrInfo), null, 2))
const templateFields = computed(() => result.value.template?.schemaJson || [])

function normalizeAllModel(value) {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      ...item,
      modelName: item.modelName || item.modelNmae || '未知模型',
    }))
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return normalizeAllModel(parsed)
    } catch {
      return []
    }
  }

  return []
}

function normalizeJson(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return { text: String(value) }
  }
}

function normalizeResult(payload = {}) {
  return {
    ...payload,
    allModel: normalizeAllModel(payload.allModel),
    ocrInfo: normalizeJson(payload.ocrInfo),
    structuredJson: normalizeJson(payload.structuredJson),
  }
}

function syncCorrectionForm() {
  const source = result.value.correctedJson || result.value.structuredJson || result.value.ocrInfo || {}
  Object.keys(correctionForm).forEach((key) => {
    delete correctionForm[key]
  })
  templateFields.value.forEach((field) => {
    correctionForm[field.key] = source[field.key] ?? field.defaultValue ?? ''
  })
}

function beforeUpload(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 <= 10

  if (!isImage && !isPdf) {
    ElMessage.error('仅支持 JPG、PNG、JPEG、WEBP 或 PDF 文件')
    return false
  }

  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }

  uploading.value = true
  activeStep.value = 0
  statusType.value = 'info'
  statusMessage.value = '正在上传文件'
  return true
}

function handleUploadSuccess(response) {
  uploading.value = false
  if (!response?.success || !response.data) {
    statusType.value = 'error'
    statusMessage.value = response?.message || '文件上传失败'
    ElMessage.error(statusMessage.value)
    return
  }

  currentFile.value = {
    ...(currentFile.value || {}),
    ...response.data,
    previewUrl: currentFile.value?.previewUrl || '',
  }
  imageUrl.value = ''
  result.value = {}
  activeStep.value = 1
  statusType.value = 'success'
  statusMessage.value = '文件上传成功'
  ElMessage.success('文件上传成功')
}

function handleUploadError() {
  uploading.value = false
  activeStep.value = 0
  statusType.value = 'error'
  statusMessage.value = '文件上传失败'
  ElMessage.error('文件上传失败，请重试')
}

function handleUploadChange(file) {
  if (file.raw && file.raw.type.startsWith('image/')) {
    if (currentFile.value?.previewObjectUrl) {
      URL.revokeObjectURL(currentFile.value.previewObjectUrl)
    }
    const previewObjectUrl = URL.createObjectURL(file.raw)
    currentFile.value = {
      ...(currentFile.value || {}),
      originalName: file.name,
      mimeType: file.raw.type,
      size: file.raw.size,
      previewUrl: previewObjectUrl,
      previewObjectUrl,
    }
  }
}

function useUrlSource() {
  const url = imageUrl.value.trim()
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      throw new Error('仅支持 HTTPS URL')
    }
  } catch (error) {
    ElMessage.warning(error.message || '请输入有效 URL')
    return
  }

  currentFile.value = {
    id: '',
    url,
    originalName: url,
    mimeType: '',
    size: 0,
  }
  result.value = {}
  activeStep.value = 1
  statusType.value = 'info'
  statusMessage.value = '已选择远程文件'
}

async function startRecognition() {
  if (!currentFile.value) {
    ElMessage.warning('请先上传文件或输入 URL')
    return
  }

  recognizing.value = true
  startTime.value = Date.now()
  recognitionTime.value = ''
  activeStep.value = 2
  statusType.value = 'info'
  statusMessage.value = '正在分类和识别'

  try {
    const payload = currentFile.value.id
      ? { fileId: currentFile.value.id }
      : { imageUrl: currentFile.value.url }
    const response = await classifyOcr(payload)
    result.value = normalizeResult(response)
    syncCorrectionForm()
    recognitionTime.value = ((Date.now() - startTime.value) / 1000).toFixed(2)
    activeStep.value = 4
    statusType.value = 'success'
    statusMessage.value = '识别完成'
    ElMessage.success(`识别完成，耗时 ${recognitionTime.value} 秒`)
  } catch (error) {
    activeStep.value = 2
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || '识别失败'
    ElMessage.error(statusMessage.value)
  } finally {
    recognizing.value = false
  }
}

function resetWorkspace() {
  if (currentFile.value?.previewObjectUrl) {
    URL.revokeObjectURL(currentFile.value.previewObjectUrl)
  }
  imageUrl.value = ''
  currentFile.value = null
  result.value = {}
  correctionId.value = ''
  recognitionTime.value = ''
  activeStep.value = 0
  statusMessage.value = ''
  statusType.value = 'info'
}

onUnmounted(() => {
  if (currentFile.value?.previewObjectUrl) {
    URL.revokeObjectURL(currentFile.value.previewObjectUrl)
  }
})

function formatSize(size) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function copyToClipboard(text, successMessage) {
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success(successMessage))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

function copyText() {
  copyToClipboard(result.value.ocrText || '', '识别文本已复制')
}

function copyJson() {
  copyToClipboard(formattedJson.value, 'JSON 已复制')
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

function downloadText() {
  downloadBlob(result.value.ocrText || '', 'ocr-result.txt', 'text/plain;charset=utf-8')
}

function downloadJson() {
  downloadBlob(formattedJson.value, 'ocr-result.json', 'application/json;charset=utf-8')
}

async function saveCorrectionRecord() {
  const historyId = result.value.id || result.value.historyId
  if (!historyId) {
    ElMessage.warning('当前结果暂无可保存的历史记录')
    return
  }

  const response = await saveCorrection(historyId, {
    originalJson: result.value.structuredJson || result.value.ocrInfo || {},
    correctedJson: { ...correctionForm },
    status: 'draft',
  })
  correctionId.value = response.data?.id || ''
  result.value.correctedJson = { ...correctionForm }
  ElMessage.success('校对结果已保存')
}

async function confirmCorrectionRecord() {
  if (!correctionId.value) {
    ElMessage.warning('请先保存校对结果')
    return
  }
  await confirmCorrection(correctionId.value)
  ElMessage.success('校对结果已确认')
}
</script>

<style scoped>
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(360px, 430px) minmax(0, 1fr);
  gap: var(--spacing-lg);
}

.panel {
  padding: var(--spacing-lg);
  min-width: 0;
}

.panel-title h2,
.models-list h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.panel-subtitle {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.upload-area {
  margin-bottom: var(--spacing-md);
}

.upload-area :deep(.el-upload-dragger) {
  min-height: 184px;
}

.upload-icon {
  font-size: 42px;
  color: var(--primary-color);
}

.upload-text {
  color: var(--text-primary);
  margin-top: var(--spacing-sm);
}

.upload-tip {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.url-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.preview-box {
  border: 1px dashed rgba(36, 85, 214, 0.2);
  border-radius: 16px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  margin-bottom: var(--spacing-md);
  background: linear-gradient(180deg, rgba(248, 250, 254, 0.88) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.image-preview {
  width: 100%;
  height: 280px;
  background: #f5f7fa;
}

.pdf-preview {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
}

.pdf-preview .el-icon {
  font-size: 54px;
  color: var(--primary-color);
}

.file-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 14px 16px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-top: 1px solid rgba(16, 35, 63, 0.08);
}

.file-meta span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recognize-button {
  width: 100%;
}

.status-steps {
  max-width: 420px;
}

.status-alert,
.result-summary,
.models-list,
.result-tabs {
  margin-bottom: var(--spacing-md);
}

.result-content {
  min-height: 260px;
  max-height: 360px;
  overflow: auto;
}

.correction-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
}

.correction-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(248, 250, 254, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid rgba(16, 35, 63, 0.08);
}

.correction-field label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

@media (max-width: 1024px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .correction-form {
    grid-template-columns: 1fr;
  }

  .status-steps {
    max-width: none;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .panel-title,
  .url-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
