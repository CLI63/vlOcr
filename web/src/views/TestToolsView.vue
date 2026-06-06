<template>
  <div class="test-tools">
    <!-- <h1>测试工具</h1> -->

    <div class="test-methods">
      <el-row :gutter="20" align="middle">
        <el-col :span="14">
          <el-input
            v-model="imageUrl"
            placeholder="或输入影像URL"
            :disabled="recognizing"
            clearable
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-upload
            class="compact-upload"
            :action="uploadUrl"
            :before-upload="beforeUpload"
            :on-success="handleSuccess"
            :on-error="handleError"
            :show-file-list="false"
            accept="image/*"
            name="file"
            :disabled="recognizing || uploading"
            :headers="uploadHeaders"
          >
            <el-button :loading="uploading" :disabled="uploading || recognizing">
              <el-icon><upload-filled /></el-icon>
              上传文件
            </el-button>
            <div class="upload-tip">JPG/PNG/JPEG ≤ 1MB</div>
          </el-upload>
        </el-col>

        <el-col :span="2">
          <el-button
            type="primary"
            :loading="recognizing"
            :disabled="(!uploadedImage && !imageUrl) || recognizing"
            @click="startRecognition"
          >
            开始识别
          </el-button>
        </el-col>
      </el-row>
    </div>
    <!-- v-if="result || recognizing" -->
    <div class="result-section">
      <h3>识别结果</h3>
      <!-- v-if="recognizing" -->
      <div v-if="recognizing" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在识别中...</span>
      </div>
      <!-- v-if="result" -->
      <div class="result-container" v-else>
        <div class="result-grid">
          <!-- 左侧：模型信息和识别文本 -->
          <div class="result-info">
            <h4>模型信息</h4>
            <div class="info-card">
              <p><strong>最佳匹配模型：</strong>{{ result.bestMatch }}</p>
              <p v-if="recognitionTime > 0"><strong>识别耗时：</strong>{{ recognitionTime }} 秒</p>
              <div v-if="result.allModel && result.allModel.length > 0">
                <h5>匹配到的模型：</h5>
                <div v-for="(model, index) in result.allModel" :key="index" class="model-info">
                  <p><strong>模型：</strong>{{ model.modelNmae }}</p>
                  <p><strong>关键词：</strong>{{ model.keyWords ? model.keyWords.join(', ') : '暂无关键词' }}</p>
                  <p><strong>权重：</strong>{{ model.score }}</p>
                </div>
              </div>
              <div class="ocr-text-content">
                <h5>识别文本：</h5>
                <pre style="height: 308px">{{ result.ocrText || '暂无结果' }}</pre>
              </div>
            </div>
          </div>

          <!-- 右侧：OCR详细信息（可折叠JSON） -->
          <div class="ocr-result">
            <h4>OCR详细信息</h4>
            <div class="info-card">
              <el-button
                type="primary"
                size="small"
                @click="copyResult"
                style="margin-bottom: 20px"
              >
                <el-icon><DocumentCopy /></el-icon>
                一键复制
              </el-button>
              <el-collapse v-model="activeNames">
                <!-- <el-collapse-item title="点击查看详细JSON结果" name="1">
                </el-collapse-item> -->
                <pre class="json-content" style="min-height: 300px">{{
                  JSON.stringify(result.ocrInfo, null, 2) || '暂无结果'
                }}</pre>
              </el-collapse>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, DocumentCopy, Download, Loading, Link } from '@element-plus/icons-vue'
import { classifyOcr } from '@/api/test'

defineOptions({
  name: 'TestToolsView',
})

const uploadUrl = `${import.meta.env.VITE_FILE_API_BASE_URL}/api/upload/single`
const uploadedImage = ref('')
const imageUrl = ref('')
const recognizing = ref(false)
const uploading = ref(false)
const result = ref({})
const activeNames = ref([])
const recognitionTime = ref(0)
const startTime = ref(0)

// console.log('文件上传地址：' + import.meta.env.VITE_FILE_API_BASE_URL)
// console.log('API接口地址：' + import.meta.env.VITE_API_BASE_URL)

// 文件上传请求头，包含Authorization认证
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

const testForm = reactive({
  model: 'general-ocr',
  type: 'ocr',
})

const typeMap = {
  ocr: '文字识别',
  table: '表格识别',
  invoice: '票据识别',
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB！')
    return false
  }
  uploading.value = true
  return true
}

const handleSuccess = (response, file) => {
  uploading.value = false
  if (response.success) {
    uploadedImage.value = response.data.url
    ElMessage.success('文件上传成功')
    // 文件上传成功后自动调用classifyOcr接口
    classifyImage(response.data.url)
  } else {
    ElMessage.error(response.message || '文件上传失败')
  }
}

const handleError = (error) => {
  uploading.value = false
  ElMessage.error('文件上传失败，请重试')
}

const classifyImage = async (url) => {
  recognizing.value = true
  startTime.value = Date.now()
  recognitionTime.value = 0

  try {
    const response = await classifyOcr({ imageUrl: url })
    const endTime = Date.now()
    recognitionTime.value = ((endTime - startTime.value) / 1000).toFixed(2)

    if (response && !response.error) {
      result.value = response
      ElMessage.success(`识别完成，耗时 ${recognitionTime.value} 秒`)
    } else {
      ElMessage.error('识别失败: ' + (response.error || '未知错误'))
    }
  } catch (error) {
    console.error('识别错误:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    recognizing.value = false
    // 识别完成后清空上传的文件
    uploadedImage.value = ''
  }
}

const recognizeByUrl = async () => {
  if (!imageUrl.value.trim()) {
    ElMessage.warning('请输入有效的影像URL地址')
    return
  }

  // 验证URL格式
  try {
    new URL(imageUrl.value)
  } catch {
    ElMessage.warning('请输入有效的URL地址')
    return
  }

  uploadedImage.value = imageUrl.value
  await classifyImage(imageUrl.value)
}

const startRecognition = () => {
  const url = imageUrl.value.trim()
  result.value = {}
  if (uploadedImage.value) {
    classifyImage(uploadedImage.value)
  } else if (url) {
    try {
      new URL(url)
      classifyImage(url)
    } catch {
      ElMessage.error('请输入有效的URL地址')
    }
  } else {
    ElMessage.warning('请先上传图片或输入影像URL')
  }
}

const resetTest = () => {
  uploadedImage.value = ''
  result.value = null
  testForm.model = 'general-ocr'
  testForm.type = 'ocr'
}

const saveResult = () => {
  // 实际项目中应该调用API保存结果
  ElMessage.success('结果已保存到历史记录')
}

const copyResult = () => {
  const copyText = JSON.stringify(result.value.ocrInfo, null, 2)
  navigator.clipboard
    .writeText(copyText)
    .then(() => {
      ElMessage.success('OCR识别结果已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

const getConfidenceClass = (confidence) => {
  if (confidence >= 90) return 'high-confidence'
  if (confidence >= 80) return 'medium-confidence'
  return 'low-confidence'
}
</script>

<style scoped>
.test-tools {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.test-tools h1 {
  color: #333;
  margin-bottom: 30px;
}

.test-methods {
  margin-bottom: 30px;
}

.compact-upload {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.url-input-group {
  display: flex;
  align-items: center;
}

.test-options {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.test-options h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.result-section {
  margin-top: 30px;
}

.result-section h3 {
  color: #333;
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-container .el-icon {
  margin-right: 8px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.result-container {
  margin-top: 30px;
  max-width: 1200px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}

.result-info,
.ocr-result {
  min-width: 0;
}

.ocr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.info-card,
.ocr-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.model-info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.ocr-text pre,
.ocr-details pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .result-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .result-info,
  .ocr-result {
    width: 100%;
  }
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

.ocr-text-content pre,
.json-content {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  max-height: 330px;
  overflow-y: auto;
}

.el-collapse {
  border: none;
}

.el-collapse-item__header {
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  line-height: 40px;
  background-color: #f5f7fa;
  padding: 0 12px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.el-collapse-item__content {
  padding-bottom: 0;
}
</style>
