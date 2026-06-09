<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-shell">
        <div class="brand-block">
          <div class="brand-mark">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="brand-copy">
            <strong>vlOcr</strong>
            <span>识别后台</span>
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
              <span class="menu-item-label">{{ item.label }}</span>
            </router-link>
          </nav>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <h1>{{ currentPageTitle }}</h1>
        </div>

        <div class="header-right">
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
    icon: DataLine,
  },
  {
    path: '/dashboard/users',
    label: '用户管理',
    icon: UserFilled,
    adminOnly: true,
  },
  {
    path: '/dashboard/models',
    label: '模型管理',
    icon: Document,
  },
  {
    path: '/dashboard/history',
    label: '历史记录',
    icon: Clock,
  },
  {
    path: '/dashboard/tasks',
    label: '批量任务',
    icon: Files,
  },
  {
    path: '/dashboard/templates',
    label: '模板管理',
    icon: Tickets,
    adminOnly: true,
  },
  {
    path: '/dashboard/test',
    label: '识别工作台',
    icon: Tools,
  },
  {
    path: '/dashboard/profile',
    label: '个人中心',
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
  background: var(--bg-base);
}

.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  max-width: var(--sidebar-width);
  flex-shrink: 0;
  padding: 14px 12px;
}

.sidebar-shell {
  height: calc(100vh - 28px);
  position: sticky;
  top: 14px;
  background: var(--bg-sidebar);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  color: rgba(232, 239, 251, 0.92);
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%);
  color: #ffffff;
  font-size: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.brand-copy strong {
  font-size: 17px;
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
  gap: 4px;
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
  min-height: 42px;
  padding: 8px 10px;
  border-radius: 8px;
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
  transform: none;
}

.menu-item.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.menu-item-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
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

.menu-item-label {
  font-size: 14px;
  font-weight: 600;
  color: inherit;
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
  padding: 12px 22px 0 4px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-left {
  min-width: 0;
}

.header-left h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: var(--text-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.user-info:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
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
  padding: 8px 22px 22px 4px;
}

.content {
  height: 100%;
  border-radius: 8px;
  background: transparent;
  border: 0;
  padding: 0;
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
