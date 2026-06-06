<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <h2>OCR管理系统</h2>
      </div>
      <nav class="menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: $route.path === item.path }"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <el-tooltip content="帮助中心" placement="right">
          <div class="sidebar-footer-item">
            <el-icon><QuestionFilled /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="设置" placement="right">
          <div class="sidebar-footer-item">
            <el-icon><Setting /></el-icon>
          </div>
        </el-tooltip>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>
        <div class="header-right">
          <el-tooltip content="消息通知" placement="bottom">
            <el-badge :value="3" class="notification-badge">
              <el-icon class="header-icon"><Bell /></el-icon>
            </el-badge>
          </el-tooltip>
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar
                :size="32"
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
              />
              <span class="username">管理员</span>
              <el-icon><CaretBottom /></el-icon>
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

      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
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
  User,
  UserFilled,
  DataLine,
  Monitor,
  QuestionFilled,
  Setting,
  Bell,
  CaretBottom,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const menuItems = [
  {
    path: '/dashboard/ocr-statistics',
    label: '首页',
    icon: DataLine,
  },
  {
    path: '/dashboard/users',
    label: '用户管理',
    icon: UserFilled,
  },
  {
    path: '/dashboard/models',
    label: '模型管理',
    icon: Document,
  },
  {
    path: '/dashboard/history',
    label: '历史识别记录',
    icon: Clock,
  },
  {
    path: '/dashboard/test',
    label: '测试工具',
    icon: Tools,
  },
  {
    path: '/dashboard/profile',
    label: '个人中心',
    icon: User,
  },
]

const currentPageTitle = computed(() => {
  const item = menuItems.find((item) => item.path === route.path)
  return item ? item.label : '管理后台'
})

const cachedViews = ref([
  'ModelManagementView',
  'HistoryRecordsView',
  'TestToolsView',
  'ProfileView',
])

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-layout);
}

.sidebar {
  width: 240px;
  background: var(--bg-container);
  color: var(--text-primary);
  flex-shrink: 0;
  min-width: 240px;
  max-width: 240px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.logo {
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.logo h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.menu {
  padding: var(--spacing-md) 0;
  flex: 1;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;
  margin-bottom: 4px;
}

.menu-item:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.menu-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
  font-weight: 500;
}

.menu-item .el-icon {
  margin-right: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-around;
}

.sidebar-footer-item {
  padding: var(--spacing-sm);
  cursor: pointer;
  color: var(--text-light);
  transition: color var(--transition-fast);
}

.sidebar-footer-item:hover {
  color: var(--primary-color);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg);
  height: 64px;
  background: var(--bg-container);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-right {
  gap: var(--spacing-lg);
}

.header-icon {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.header-icon:hover {
  color: var(--primary-color);
}

.notification-badge {
  margin-right: var(--spacing-lg);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-fast);
}

.user-info:hover {
  background-color: var(--bg-layout);
}

.username {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  margin: 0 var(--spacing-sm);
}

.content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar {
    width: 64px;
    min-width: 64px;
  }

  .logo h2,
  .menu-item span {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: var(--spacing-md);
  }

  .menu-item .el-icon {
    margin-right: 0;
  }

  .sidebar-footer {
    flex-direction: column;
    align-items: center;
  }
}
</style>
