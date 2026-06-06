<script setup></script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
/* 全局样式 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: var(--font-family);
}

#app,
.app-container {
  height: 100vh;
  width: 100%;
}

/* 确保Element Plus组件使用我们的主题色 */
:root {
  --el-color-primary: var(--primary-color);
  --el-color-primary-light-3: var(--primary-hover);
  --el-color-primary-dark-2: var(--primary-active);
  --el-border-radius-base: var(--border-radius-sm);
  --el-font-size-base: var(--font-size-md);
  --el-text-color-primary: var(--text-primary);
  --el-text-color-regular: var(--text-secondary);
  --el-text-color-secondary: var(--text-light);
  --el-border-color: var(--border-color);
  --el-border-color-light: var(--border-light);
  --el-fill-color-blank: var(--bg-container);
  --el-bg-color: var(--bg-layout);
}
</style>
