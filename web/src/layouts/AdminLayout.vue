<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-shell">
        <div class="brand-block">
          <div class="brand-mark">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="brand-copy">
            <strong>OCR Control</strong>
            <span>智能识别管理后台</span>
          </div>
        </div>

        <div class="menu-group">
          <nav class="menu">
            <router-link
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              class="menu-item"
              :class="{ active: $route.path === item.path }"
            >
              <div class="menu-item-icon">
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
              </div>
              <div class="menu-item-copy">
                <span class="menu-item-label">{{ item.label }}</span>
                <small class="menu-item-desc">{{ item.description }}</small>
              </div>
            </router-link>
          </nav>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <div class="header-context">
            <span class="header-eyebrow">OCR 管理后台</span>
            <h1>{{ currentPageTitle }}</h1>
          </div>
          <div class="header-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>控制台</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="header-right">
          <div class="header-chip">
            <span>系统状态</span>
            <strong>正常</strong>
          </div>
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="36">{{ userInitial }}</el-avatar>
              <div class="user-copy">
                <strong>{{ currentUser.username || '用户' }}</strong>
                <span>{{ currentUser.role === 'admin' ? '管理员' : '普通用户' }}</span>
              </div>
              <el-icon class="caret-icon"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/dashboard/profile')">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="content-shell">
        <div class="content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Document,
  Clock,
  Tools,
  Files,
  Tickets,
  User,
  UserFilled,
  DataLine,
  Monitor,
  CaretBottom,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
})

const isAdmin = computed(() => currentUser.value.role === 'admin')
const userInitial = computed(() => (currentUser.value.username || 'U').slice(0, 1).toUpperCase())

const allMenuItems = [
  {
    path: '/dashboard/ocr-statistics',
    label: '统计分析',
    description: '识别概览与趋势',
    icon: DataLine,
  },
  {
    path: '/dashboard/users',
    label: '用户管理',
    description: '账号与权限维护',
    icon: UserFilled,
    adminOnly: true,
  },
  {
    path: '/dashboard/models',
    label: '模型管理',
    description: '业务模型与接口配置',
    icon: Document,
  },
  {
    path: '/dashboard/history',
    label: '历史记录',
    description: '识别档案与结果追溯',
    icon: Clock,
  },
  {
    path: '/dashboard/tasks',
    label: '批量任务',
    description: '任务执行与状态查看',
    icon: Files,
  },
  {
    path: '/dashboard/templates',
    label: '模板管理',
    description: '结构化模板定义',
    icon: Tickets,
    adminOnly: true,
  },
  {
    path: '/dashboard/test',
    label: '识别工作台',
    description: '上传、识别与校对',
    icon: Tools,
  },
  {
    path: '/dashboard/profile',
    label: '个人中心',
    description: '账号信息与安全设置',
    icon: User,
  },
]

const menuItems = computed(() => allMenuItems.filter((item) => !item.adminOnly || isAdmin.value))

const currentPageTitle = computed(() => {
  const item = menuItems.value.find((item) => item.path === route.path)
  return item ? item.label : '管理后台'
})

const cachedViews = ref([
  'ModelManagementView',
  'HistoryRecordsView',
  'TaskManagementView',
  'TemplateManagementView',
  'TestToolsView',
  'ProfileView',
])

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(36, 85, 214, 0.08), transparent 22%),
    linear-gradient(180deg, #eef3f9 0%, #e7edf6 100%);
}

.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  max-width: var(--sidebar-width);
  flex-shrink: 0;
  padding: 22px 18px;
}

.sidebar-shell {
  height: calc(100vh - 44px);
  position: sticky;
  top: 22px;
  background: var(--bg-sidebar);
  border-radius: 28px;
  box-shadow: var(--shadow-lg);
  color: rgba(232, 239, 251, 0.92);
  padding: 22px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 4px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%);
  color: #ffffff;
  font-size: 22px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.brand-copy strong {
  font-size: 19px;
  font-weight: 650;
  color: #ffffff;
}

.brand-copy span {
  font-size: 12px;
  color: rgba(232, 239, 251, 0.56);
}

.menu-group {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  padding-bottom: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.menu::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  color: rgba(232, 239, 251, 0.76);
  text-decoration: none;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.menu-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(2px);
}

.menu-item.active {
  color: #ffffff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.08) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.menu-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  font-size: 16px;
  flex-shrink: 0;
}

.menu-item.active .menu-item-icon {
  background: rgba(255, 255, 255, 0.14);
}

.menu-item-copy {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.menu-item-label {
  font-size: 15px;
  font-weight: 600;
  color: inherit;
}

.menu-item-desc {
  display: none;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.header {
  height: var(--header-height);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  padding: 18px 30px 0 8px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-left {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.header-context {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-eyebrow {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.header-context h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  color: var(--text-primary);
}

.header-breadcrumb {
  color: var(--text-secondary);
}

.header-chip {
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(16, 35, 63, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-xs);
}

.header-chip span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.header-chip strong {
  font-size: 13px;
  color: var(--success-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(16, 35, 63, 0.06);
  border-radius: 18px;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.user-info:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.user-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-copy strong {
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.user-copy span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.caret-icon {
  color: var(--text-tertiary);
}

.content-shell {
  flex: 1;
  min-height: 0;
  padding: 10px 30px 30px 8px;
}

.content {
  height: 100%;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px;
}

@media (max-width: 1280px) {
  .sidebar {
    width: 240px;
    min-width: 240px;
    max-width: 240px;
  }

  .content-shell {
    padding-right: 22px;
  }
}
</style>
