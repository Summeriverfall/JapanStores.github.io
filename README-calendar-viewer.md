# Google Calendar 管理界面使用说明

## 功能概述

这个界面可以同时查看和管理 5-6 个不同的 Google Calendar，通过切换 Calendar 标题来切换视图，方便管理员统一管理多个日历的事件。

## 主要功能

- ✅ 同时管理多个 Google Calendar（支持 5-6 个或更多）
- ✅ 通过标签页切换不同的 Calendar 视图
- ✅ 显示选定日期范围内的所有事件
- ✅ 自动保存配置到浏览器本地存储
- ✅ 响应式设计，支持移动设备

## 使用步骤

### 1. 获取 Google Calendar API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google Calendar API**：
   - 进入"API 和服务" → "库"
   - 搜索 "Google Calendar API"
   - 点击"启用"
4. 创建 API Key：
   - 进入"API 和服务" → "凭据"
   - 点击"创建凭据" → "API 密钥"
   - 复制生成的 API Key

### 2. 获取 Calendar ID

Calendar ID 的格式通常是：
- `abc123@group.calendar.google.com`（共享日历）
- `primary`（主日历）
- 或者是一个长字符串 ID

**如何查找 Calendar ID：**
1. 打开 Google Calendar
2. 在左侧找到要查看的日历
3. 点击日历旁边的三个点（⋮）
4. 选择"设置和共享"
5. 在"集成日历"部分，找到"日历 ID"
6. 复制这个 ID

### 3. 配置 Calendar

1. 打开 `calendar-viewer.html` 文件
2. 在"Google Calendar API Key"输入框中粘贴您的 API Key
3. 点击"+ 添加 Calendar"按钮
4. 输入 Calendar ID 和显示名称（可选）
5. 重复步骤 3-4 添加更多 Calendar（最多可添加任意数量）
6. 选择日期范围（默认为当前月份）
7. 点击"加载 Calendar 数据"按钮

### 4. 查看和管理事件

- 加载完成后，顶部会显示所有 Calendar 的标签页
- 点击不同的标签页可以切换查看不同 Calendar 的事件
- 每个事件卡片显示：
  - 事件标题
  - 日期和时间
  - 事件描述（如果有）
  - 地点（如果有）

## 注意事项

### API Key 权限

- **公开 Calendar**：使用 API Key 即可访问
- **私有 Calendar**：需要将 Calendar 设置为"公开"或使用 OAuth 2.0 认证

**将 Calendar 设置为公开：**
1. 打开 Google Calendar
2. 点击日历旁边的三个点（⋮）
3. 选择"设置和共享"
4. 在"访问权限"部分，勾选"公开此日历"
5. 选择"查看所有活动详情"

### 日期范围

- 默认显示当前月份的事件
- 可以手动选择开始和结束日期
- 点击"重置"按钮恢复为当前月份

### 数据存储

- 所有配置（API Key、Calendar ID、日期范围）会自动保存到浏览器本地存储
- 下次打开页面时会自动加载之前的配置
- 清除浏览器缓存会删除保存的配置

## 故障排除

### 1. 无法加载 Calendar 数据

**可能原因：**
- API Key 无效或未启用 Google Calendar API
- Calendar ID 错误
- Calendar 未设置为公开访问

**解决方法：**
- 检查 API Key 是否正确
- 确认已启用 Google Calendar API
- 验证 Calendar ID 是否正确
- 如果是私有 Calendar，请设置为公开或使用 OAuth

### 2. 显示 "403 Forbidden" 错误

**可能原因：**
- API Key 没有访问权限
- Calendar 未设置为公开

**解决方法：**
- 检查 API Key 的权限设置
- 将 Calendar 设置为公开访问

### 3. 显示 "404 Not Found" 错误

**可能原因：**
- Calendar ID 不正确
- Calendar 不存在或已被删除

**解决方法：**
- 重新检查并复制 Calendar ID
- 确认 Calendar 仍然存在

### 4. 事件显示不完整

**可能原因：**
- 日期范围设置不正确
- Calendar 中确实没有事件

**解决方法：**
- 扩大日期范围
- 检查 Calendar 中是否有事件

## 技术说明

### API 使用

本界面使用 Google Calendar API v3 的以下端点：
- `GET /calendars/{calendarId}/events`

### 浏览器兼容性

- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动浏览器

### 数据格式

- 日期格式：YYYY-MM-DD
- 时间格式：ISO 8601（UTC）
- 事件数据：JSON 格式

## 未来改进

- [ ] 支持 OAuth 2.0 认证（访问私有 Calendar）
- [ ] 支持创建和编辑事件
- [ ] 支持事件搜索和筛选
- [ ] 支持导出事件数据
- [ ] 支持多语言界面
- [ ] 支持日历视图（月视图、周视图、日视图）

## 支持

如有问题或建议，请联系开发团队。
