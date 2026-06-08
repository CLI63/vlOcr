# 前端代码 Bug 审查报告

审查日期：2026-06-07

审查范围：`web` 前端 Vue 3/Vite 项目，重点覆盖入口配置、路由鉴权、Axios 请求封装、主要页面组件、前后端接口返回结构匹配情况。未运行 `npm run build`，未运行类型检查，符合本项目约束。

## 结论摘要

本次前端专项审查发现多处会直接影响页面行为的 bug，其中最需要优先处理的是：

1. 个人中心错误处理 `/users/me` 返回结构，会把 `localStorage.user` 写坏，进而影响用户名展示、管理员菜单和管理员路由权限。
2. 用户管理页分页 UI 实际不分页，搜索在邮箱为空时可能触发运行时异常，状态开关提交后也不会真正生效。
3. 测试工具页宣称支持 PDF，但上传组件和校验逻辑实际禁止 PDF；识别结果中模型字段拼写错误导致模型名显示为空。
4. OCR 统计页切换图表类型和页面卸载时没有正确管理 Chart.js 实例，存在图表异常和内存泄漏风险。
5. 历史记录页“图片 URL 关键词”实际走后端精确匹配，用户输入关键词时查不到预期结果。

## P0：高优先级 Bug

### 1. 个人中心会写坏用户信息缓存，导致鉴权和菜单异常

严重程度：高

证据：

- `web/src/views/ProfileView.vue:151` 直接判断 `response` 是对象。
- `web/src/views/ProfileView.vue:154` 将整个 `response` 写入 `localStorage.user`。
- 后端 `vlmOcr_api/routes/users.js:41` 的 `/users/me` 返回结构是 `{ user }`，不是用户对象本身。
- `web/src/layouts/AdminLayout.vue:60`、`web/src/layouts/AdminLayout.vue:119` 依赖 `currentUser.username` 和 `currentUser.role`。
- `web/src/router/index.js` 路由守卫也依赖 `localStorage.user.role` 判断管理员权限。

影响：

- 用户进入个人中心后，`localStorage.user` 会从 `{ id, username, role }` 变成 `{ user: { id, username, role, ... } }`。
- 页面头部用户名可能显示为默认“用户”或旧值。
- 管理员 `role` 读取不到，刷新后可能被错误拦截到 `/dashboard/models`，无法进入用户管理。
- `AdminLayout` 和 `ModelManagementView` 中基于管理员角色展示的菜单或按钮可能消失。

建议：

- `ProfileView` 中应使用 `const user = response.user`，只把 `response.user` 合并到 `userInfo` 并写入 `localStorage`。
- 建议封装统一用户状态，例如 Pinia `authStore`，避免多个页面直接读写 `localStorage`。
- 同时兼容 `created_at` 字段，见下一条。

### 2. 个人中心创建时间字段取错

严重程度：中

证据：

- `web/src/views/ProfileView.vue:18` 使用 `userInfo.createdAt`。
- `web/src/views/ProfileView.vue:78` 初始化字段也是 `createdAt`。
- 后端 `AuthService.getUserById()` 返回数据库原字段，用户列表也明确使用 `created_at`。

影响：

- 个人中心“创建时间”大概率一直显示“未知”。

建议：

- 前端统一使用 `created_at`，或在 API 层把后端字段规范化为前端字段。

## P1：中高优先级 Bug

### 3. 用户管理分页控件不生效

严重程度：中

证据：

- `web/src/views/UserManagementView.vue:55` 表格直接绑定 `filteredUserList`。
- `web/src/views/UserManagementView.vue:254` `filteredUserList` 只做搜索过滤，没有按 `currentPage` 和 `pageSize` 切片。
- `web/src/views/UserManagementView.vue:116` 到 `web/src/views/UserManagementView.vue:123` 渲染了分页控件。
- `web/src/views/UserManagementView.vue:459`、`web/src/views/UserManagementView.vue:465` 页码变化只是重新请求完整用户列表。
- 后端 `GET /users` 当前返回完整 `{ users }`，没有接收分页参数。

影响：

- 用户点击第 2 页、第 3 页，表格内容仍展示完整列表或同一批数据。
- `pageSize` 改成 10/20/50/100 不会改变表格行数。
- 用户量较多时页面性能和可用性会变差。

建议：

- 如果后端不分页，前端应新增 `pagedUserList = filteredUserList.slice((currentPage - 1) * pageSize, currentPage * pageSize)`，表格绑定 `pagedUserList`。
- 如果后端分页，应给 `getUserList` 增加 `page`、`limit` 参数，并以后端返回的 `total` 为准。

### 4. 用户管理搜索邮箱为空时可能报错

严重程度：中

证据：

- `web/src/views/UserManagementView.vue:260` 直接调用 `user.email.toLowerCase()`。
- 用户注册接口中邮箱并非强制业务字段，历史数据也可能存在 `email = null`。

影响：

- 只要用户列表中存在空邮箱用户，输入搜索关键字时就可能触发 `Cannot read properties of null/undefined`，导致页面渲染异常。

建议：

- 搜索时使用 `(user.email || '').toLowerCase()`。
- 用户名也建议使用 `(user.username || '')` 做防御。

### 5. 用户管理“状态”开关是假状态，提交后不会真正生效

严重程度：中

证据：

- `web/src/views/UserManagementView.vue:150` 到 `web/src/views/UserManagementView.vue:158` 提供状态开关。
- `web/src/views/UserManagementView.vue:368`、`web/src/views/UserManagementView.vue:381` 提交 `status`。
- 后端 `AuthService.register()` 固定写入 `role: 'user'`，未处理 `status`。
- 后端 `AuthService.updateUser()` 的 `allowedFields` 只有 `username`、`email`，会过滤掉 `status`。
- `web/src/views/UserManagementView.vue:304` 又给缺失状态默认补成 `active`。

影响：

- 管理员把用户切到“禁用”后，接口返回成功也不会真正禁用。
- 重新加载后状态仍会显示“正常”，造成严重的管理误导。

建议：

- 若产品需要禁用用户，后端用户表、注册、更新、登录校验都应支持 `status`。
- 若暂不支持，应移除前端状态列和状态开关，避免误导。

### 6. 测试工具页提示支持 PDF，但实际禁止上传 PDF

严重程度：中

证据：

- `web/src/views/TestToolsView.vue:36` 提示 `JPG/PNG/JPEG/WEBP/PDF ≤ 10MB`。
- `web/src/views/TestToolsView.vue:27` 上传组件 `accept="image/*"`。
- `web/src/views/TestToolsView.vue:155` 用 `file.type.startsWith('image/')` 判断文件类型。
- `web/src/views/TestToolsView.vue:158` 非图片直接提示“只能上传图片文件”。
- 后端上传接口已允许 PDF。

影响：

- 用户按提示上传 PDF 时无法选择或会被前端拒绝。
- 前后端能力不一致，测试工具无法覆盖 PDF OCR 流程。

建议：

- 如果需要支持 PDF：`accept` 改为 `image/*,application/pdf,.pdf`，校验逻辑允许 `application/pdf` 和 `.pdf`。
- 如果不需要支持 PDF：删除 UI 中的 PDF 提示，并与后端限制保持一致。

### 7. 测试工具页识别结果模型名字段拼写错误

严重程度：中

证据：

- `web/src/views/TestToolsView.vue:72` 使用 `model.modelNmae`。
- 后端分类器 `vlmOcr_api/utils/classifier.js:52` 返回字段是 `modelName`。

影响：

- “匹配到的模型”列表中模型名显示为空。

建议：

- 改为 `model.modelName`。
- 可额外兼容旧数据：`model.modelName || model.modelNmae || '未知模型'`。

### 8. 测试工具页没有规范化历史命中返回的 `allModel` 和 `ocrInfo`

严重程度：中

证据：

- `web/src/views/TestToolsView.vue:69` 假设 `result.allModel` 是数组。
- `web/src/views/TestToolsView.vue:71` 对 `result.allModel` 做 `v-for`。
- `web/src/views/TestToolsView.vue:101` 直接 `JSON.stringify(result.ocrInfo, null, 2)`。
- 后端 `vlmOcr_api/routes/classifyOcr.js:55` 到 `vlmOcr_api/routes/classifyOcr.js:58` 历史命中时直接返回数据库中的 `allModel`、`ocrInfo`。
- 后端 `vlmOcr_api/routes/ocr.js:74` 已存在把 `allModel` 存成 JSON 字符串的路径。

影响：

- 历史命中时 `allModel` 如果是字符串，`v-for` 会按字符迭代，列表渲染异常。
- `ocrInfo` 如果是 JSON 字符串，页面会显示转义后的字符串，而不是格式化对象。
- 一键复制可能复制带引号和转义符的内容。

建议：

- 在 `classifyImage()` 收到响应后统一做数据归一化：如果 `allModel` 是字符串则 `JSON.parse`，失败时置空数组；如果 `ocrInfo` 是字符串且可解析则转对象。
- 后端也建议统一历史记录字段序列化/反序列化策略。

## P2：中低优先级 Bug 与体验问题

### 9. OCR 统计页切换图表类型时先销毁实例再读取数据，逻辑脆弱

严重程度：中

证据：

- `web/src/views/OcrStatisticsView.vue:421` 先 `trendChartInstance.destroy()`。
- `web/src/views/OcrStatisticsView.vue:424` 再读取 `trendChartInstance.data`。

影响：

- Chart.js 实例销毁后再读取内部数据属于脆弱用法，后续升级 Chart.js 或运行状态变化时可能导致图表切换失败。
- 更安全的写法是销毁前先缓存 `const chartData = trendChartInstance.data`。

建议：

- 调整为先保存 `chartData`，再销毁实例并重建。
- 或只更新图表 `config.type` 不方便时，至少避免读取已销毁实例。

### 10. OCR 统计页未在卸载时销毁 Chart.js 实例

严重程度：中

证据：

- `web/src/views/OcrStatisticsView.vue:174` 只导入了 `onMounted`，没有 `onUnmounted`。
- `web/src/views/OcrStatisticsView.vue:505`、`web/src/views/OcrStatisticsView.vue:546` 只在重新拉取数据时销毁旧图表。

影响：

- 离开统计页时 Chart.js 实例仍持有 canvas 和事件引用，存在内存泄漏风险。
- 多次进入/离开页面后可能出现 canvas 被占用、图表不刷新或页面变慢。

建议：

- 引入 `onUnmounted`，在卸载时 `trendChartInstance?.destroy()` 和 `pieChartInstance?.destroy()`，并置为 `null`。

### 11. 历史记录“图片 URL 关键词”实际是精确匹配

严重程度：低到中

证据：

- `web/src/views/HistoryRecordsView.vue:8` 输入框 placeholder 是“图片URL关键词”。
- `web/src/views/HistoryRecordsView.vue:131` 使用 `searchForm.imgUrl` 作为查询条件。
- 后端 `vlmOcr_api/services/databaseService.js:309` 使用 `imgUrl = ?` 精确匹配，不是 `LIKE`。

影响：

- 用户输入 URL 片段或关键词时查不到记录。
- UI 文案和实际查询语义不一致。

建议：

- 如果期望模糊搜索，后端改为 `imgUrl LIKE ?`，并给参数加 `%keyword%`。
- 如果期望精确搜索，前端 placeholder 改为“完整图片 URL”。

### 12. `localStorage` 用户信息不是响应式来源，页面内更新后菜单不会立即刷新

严重程度：低到中

证据：

- `web/src/layouts/AdminLayout.vue:111` 到 `web/src/layouts/AdminLayout.vue:117` 在 `computed` 中读取 `localStorage`。
- `web/src/layouts/AdminLayout.vue:119` 的 `isAdmin` 依赖该 computed。
- `web/src/views/ModelManagementView.vue:419` 到 `web/src/views/ModelManagementView.vue:427` 也用相同方式判断管理员。

影响：

- `localStorage` 本身不是 Vue 响应式数据源，同页内修改用户信息后，头部用户名、管理员菜单、管理员按钮不会稳定刷新。
- 与第 1 条 bug 叠加后，用户进入个人中心可能破坏缓存，但布局不会立即暴露问题，刷新后才表现为权限异常，排查成本高。

建议：

- 使用 Pinia 管理 `token` 和 `user`，登录、退出、获取用户信息都通过 store 更新。
- 路由守卫和页面按钮统一依赖 store，而不是各自解析 `localStorage`。

### 13. 登录和请求拦截器可能重复弹错误提示

严重程度：低

证据：

- `web/src/utils/request.js` 响应拦截器遇到错误会 `ElMessage.error(...)`。
- `web/src/views/LoginView.vue:151` 到 `web/src/views/LoginView.vue:166` catch 中再次按状态码弹错误。
- `ProfileView`、`ModelManagementView`、`UserManagementView` 多处 catch 中也会再次弹错误。

影响：

- 一次接口失败可能出现两条错误提示。
- 用户体验噪音增加，尤其是登录失败、认证过期、保存失败时。

建议：

- 明确分工：拦截器只做认证失效和标准错误归一化，页面负责业务提示；或拦截器统一提示，页面不重复提示。

### 14. 生产环境 API 地址硬编码为 HTTP

严重程度：低到中

证据：

- `web/.env.production` 中 `VITE_API_BASE_URL=http://117.72.118.131:3000`。
- `web/.env.production` 中 `VITE_FILE_API_BASE_URL=http://117.72.118.131:3000`。

影响：

- 生产登录 token 和 OCR 数据会通过明文 HTTP 传输。
- 如果前端部署在 HTTPS 页面，调用 HTTP API 可能被浏览器 Mixed Content 策略拦截。

建议：

- 生产环境使用 HTTPS API 域名。
- 尽量避免把固定 IP 写入前端构建配置，改用域名和反向代理。

## 建议修复顺序

1. 先修复 `ProfileView` 的 `/users/me` 解包和 `localStorage.user` 写入问题，这是会连带破坏管理员权限的核心 bug。
2. 修复 `UserManagementView` 的分页、空邮箱搜索异常和状态开关假生效问题。
3. 修复 `TestToolsView` 的 PDF 上传限制、`modelName` 拼写和响应归一化。
4. 修复 `OcrStatisticsView` 的 Chart.js 实例销毁和切换逻辑。
5. 统一历史查询文案与后端匹配方式，并梳理全局错误提示策略。

## 未执行项说明

根据项目指令，本次审查没有运行 `npm run build`，也没有运行类型检查或 `npm ts:check`。审查结论来自静态代码阅读、前后端接口契约核对和关键字段流转分析。
