<template>
  <div class="page-container template-management">
    <div class="page-header">
      <div class="page-title">
        <el-icon class="page-icon"><Files /></el-icon>
        <div>
          <h1>模板管理</h1>
          <p class="page-subtitle">维护结构化字段定义，统一识别结果的导出与校对格式。</p>
        </div>
      </div>
      <div class="page-actions">
        <el-button @click="loadTemplates">
          <el-icon><Refresh /></el-icon>
          刷新模板
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增模板
        </el-button>
      </div>
    </div>

    <div class="template-summary">
      <div class="summary-card surface-card">
        <span>模板总数</span>
        <strong>{{ templates.length }}</strong>
      </div>
      <div class="summary-card surface-card">
        <span>平均字段数</span>
        <strong>{{ averageFieldCount }}</strong>
      </div>
    </div>

    <el-card class="app-card">
      <div class="card-toolbar">
        <div class="toolbar-left">
          <el-tag type="info" effect="plain">结构化模板中心</el-tag>
        </div>
      </div>

      <el-table :data="templates" v-loading="loading" border stripe>
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="90" />
        <el-table-column label="字段数" width="100">
          <template #default="{ row }">
            {{ row.schemaJson?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="editTemplate(row)">编辑</el-button>
            <el-button size="small" @click="previewTemplate(row)">预览</el-button>
            <el-button size="small" type="danger" @click="removeTemplate(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑模板' : '新增模板'"
      width="min(1080px, calc(100vw - 48px))"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px" class="template-form">
        <el-form-item label="模板名称">
          <el-input v-model="form.name" placeholder="例如：发票识别、合同关键信息、身份证信息" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简单说明这个模板用于哪类文件" />
        </el-form-item>
        <el-form-item label="字段定义">
          <div class="field-editor">
            <div class="field-guide">
              <el-icon><InfoFilled /></el-icon>
              <span>字段就是识别结果里的栏目。比如发票模板可填写：发票号码、开票日期、金额、购买方名称。</span>
            </div>
            <div v-for="(field, index) in form.schemaJson" :key="index" class="field-row">
              <div class="field-row-head">
                <strong>字段 {{ index + 1 }}</strong>
                <el-button type="danger" text @click="removeField(index)">删除</el-button>
              </div>
              <div class="field-row-grid">
                <div class="field-control">
                  <label>
                    字段标识
                    <el-tooltip content="给系统看的英文或拼音名称，建议只用字母、数字、下划线，例如 invoice_no。" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </label>
                  <el-input v-model="field.key" placeholder="如 invoice_no" />
                </div>
                <div class="field-control">
                  <label>
                    显示名称
                    <el-tooltip content="给人看的字段名，会显示在模板校对表单里，例如 发票号码。" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </label>
                  <el-input v-model="field.label" placeholder="如 发票号码" @blur="syncFieldExportLabel(field)" />
                </div>
                <div class="field-control field-control--type">
                  <label>内容类型</label>
                  <el-select v-model="field.type" placeholder="类型">
                    <el-option label="文本" value="text" />
                    <el-option label="数字" value="number" />
                    <el-option label="日期" value="date" />
                    <el-option label="多行文本" value="textarea" />
                  </el-select>
                </div>
                <div class="field-control">
                  <label>
                    导出列名
                    <el-tooltip content="导出 Excel/JSON 时使用的列标题。留空时建议与显示名称一致。" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </label>
                  <el-input v-model="field.exportLabel" placeholder="如 发票号码" />
                </div>
                <div class="field-control field-control--order">
                  <label>排序</label>
                  <el-input-number v-model="field.order" :min="1" :max="999" />
                </div>
                <div class="field-control field-control--required">
                  <label>
                    必填
                    <el-tooltip content="打开后表示这个字段很重要，后续校对时应尽量补齐。" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </label>
                  <div class="field-switch">
                    <span>{{ field.required ? '是' : '否' }}</span>
                    <el-switch v-model="field.required" />
                  </div>
                </div>
                <div class="field-control">
                  <label>
                    默认值
                    <el-tooltip content="识别不到内容时自动填入的值。一般可以留空。" placement="top">
                      <el-icon><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </label>
                  <el-input v-model="field.defaultValue" placeholder="通常留空" />
                </div>
              </div>
            </div>
          </div>
          <el-button @click="addField">
            <el-icon><Plus /></el-icon>
            添加字段
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="saveTemplateRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="previewVisible" title="模板预览" size="40%">
      <pre class="preview-content">{{ JSON.stringify(previewData, null, 2) }}</pre>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Files, InfoFilled, Plus, QuestionFilled, Refresh } from '@element-plus/icons-vue'
import { createTemplate, deleteTemplate, getTemplates, updateTemplate } from '@/api/templates'

defineOptions({
  name: 'TemplateManagementView',
})

const loading = ref(false)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const submitLoading = ref(false)
const templates = ref([])
const previewData = ref({})
const form = reactive({
  id: '',
  name: '',
  description: '',
  schemaJson: [],
})

const averageFieldCount = computed(() => {
  if (!templates.value.length) return 0
  const totalFields = templates.value.reduce((sum, item) => sum + (item.schemaJson?.length || 0), 0)
  return Math.round((totalFields / templates.value.length) * 10) / 10
})

function createField() {
  return {
    key: '',
    label: '',
    type: 'text',
    required: false,
    exportLabel: '',
    order: form.schemaJson.length + 1,
    defaultValue: '',
    rules: '',
  }
}

async function loadTemplates() {
  loading.value = true
  try {
    const response = await getTemplates()
    templates.value = response.data || []
  } catch (error) {
    ElMessage.error('获取模板失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.description = ''
  form.schemaJson = [createField()]
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function editTemplate(row) {
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.schemaJson = JSON.parse(JSON.stringify(row.schemaJson || [createField()]))
  dialogVisible.value = true
}

function previewTemplate(row) {
  previewData.value = row
  previewVisible.value = true
}

function addField() {
  form.schemaJson.push(createField())
}

function syncFieldExportLabel(field) {
  if (!field.exportLabel && field.label) {
    field.exportLabel = field.label
  }
}

function removeField(index) {
  form.schemaJson.splice(index, 1)
}

async function saveTemplateRecord() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (!form.schemaJson.length || form.schemaJson.some((field) => !field.key || !field.label)) {
    ElMessage.warning('请完整填写字段定义')
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description,
      schemaJson: form.schemaJson.map((field, index) => ({
        ...field,
        order: field.order || index + 1,
      })),
    }
    if (form.id) {
      await updateTemplate(form.id, payload)
    } else {
      await createTemplate(payload)
    }
    ElMessage.success('模板保存成功')
    dialogVisible.value = false
    await loadTemplates()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '模板保存失败')
  } finally {
    submitLoading.value = false
  }
}

async function removeTemplate(row) {
  try {
    await ElMessageBox.confirm(`确认删除模板 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteTemplate(row.id)
    ElMessage.success('模板删除成功')
    await loadTemplates()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '模板删除失败')
    }
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.template-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  min-height: 82px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.summary-card strong {
  font-size: 26px;
  line-height: 1;
  color: var(--text-primary);
}

.card-toolbar {
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.field-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.field-guide {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(48, 96, 186, 0.14);
  border-radius: 8px;
  background: rgba(238, 245, 255, 0.86);
  color: var(--text-secondary);
  line-height: 1.55;
}

.field-guide .el-icon {
  flex: 0 0 auto;
  color: var(--primary-color);
}

.field-row {
  border: 1px solid rgba(16, 35, 63, 0.08);
  background: linear-gradient(180deg, rgba(248, 250, 254, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
  border-radius: 8px;
  padding: 16px;
}

.field-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: 14px;
}

.field-row-head strong {
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.field-row-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.field-control {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-control label {
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 20px;
}

.field-control label .el-icon {
  color: #8a99ad;
  cursor: help;
}

.field-control--type,
.field-control--order,
.field-control--required {
  min-width: 0;
}

.field-control--order :deep(.el-input-number) {
  width: 100%;
}

.field-control :deep(.el-select) {
  width: 100%;
}

.field-switch {
  min-height: 40px;
  border: 1px solid rgba(16, 35, 63, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  color: var(--text-secondary);
}

.template-form :deep(.el-form-item__content) {
  align-items: flex-start;
}

@media (max-width: 1200px) {
  .field-row-grid,
  .template-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .field-row-grid,
  .template-summary {
    grid-template-columns: 1fr;
  }
}
</style>
