<script setup></script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
html,
body {
  min-height: 100%;
  font-family: var(--font-family);
}

#app,
.app-container {
  min-height: 100vh;
  width: 100%;
}

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
  --el-fill-color-blank: var(--bg-panel);
  --el-bg-color: var(--bg-panel);
  --el-bg-color-page: var(--bg-base);
}
</style>
