# 门店数据门户

## 访问控制

- **门店**：通过 `login.html?store=门店名` 进入，输入密码（默认 `password`）后查看本店数据
- **管理员**：从 dashboard 进入后，可直通所有门店数据，无需密码

## 实现概要

### 1. 新增 `login.html`（门店登录页）
- 访问格式：`login.html?store=Luna`（Luna 可替换为其他门店名）
- 展示当前门店名称，输入密码后跳转至对应数据页
- 支持日 / 英 / 中三语
- 默认密码：`password`（可在 login.html 中修改 `STORE_PASSWORD` 常量）

### 2. 修改 `portal.html`
- 页面加载时做权限校验
- 通过条件：门店已登录（`sessionStorage`）或管理员身份
- 无权限时重定向到 `login.html`

### 3. 修改 `dashboard.html`
- 页面加载时设置 `sessionStorage.stores_admin = 1`
- 从 dashboard 进入的门店门户视为管理员，免密查看任意门店

### 4. 修改 `index.html`
- 根据是否管理员动态调整链接目标
- **管理员**：链接直接指向 `portal.html`
- **非管理员**：链接指向 `login.html`

### 5. 修改各门店快捷入口
- `luna.html`、`celestique-spa.html` 等统一改为跳转到对应 `login.html`（供门店使用）

## 使用流程

| 角色 | 访问路径 | 操作 |
|------|----------|------|
| 门店 | `admin/stores/luna.html` 或 `login.html?store=Luna` | 输入密码 `password` → 进入 Luna 数据页 |
| 管理员 | `admin/dashboard.html` → 点击「门店数据门户」→ 选择门店 | 无需密码，直接查看 |

> 说明：管理员需要先打开 dashboard 一次，再进入门店门户，才能免密访问。

**修改密码**：在 `login.html` 中搜索 `STORE_PASSWORD`，修改其值即可。

## 文件结构

| 文件 | 说明 |
|------|------|
| `index.html` | 门店列表入口，选择门店后进入数据页面 |
| `login.html` | 门店登录页，输入密码后进入 portal |
| `portal.html` | 统一数据展示页，通过 `?store=门店名` 区分不同门店，需登录或管理员身份 |
| `luna.html` | Luna 快捷入口（自动跳转到 login） |
| `celestique-spa.html` | Celestique Spa 快捷入口（跳转到 login） |
| `selene.html` | Selene 快捷入口 |
| `fi.html` | FI 快捷入口 |
| `futurekart.html` | Futurekart 快捷入口 |
| `fairy.html` | Fairy 快捷入口 |
| `starryflow.html` | starryflow 快捷入口 |

## 使用方式

1. **从列表进入**：打开 `index.html`，点击对应门店卡片
2. **直接链接**：
   - 门店：`login.html?store=Luna` 或 `luna.html`（输入密码后进入 portal）
   - 管理员：先访问 dashboard，再点击门店门户，可免密查看
3. **数据源**：使用与运营仪表盘相同的 Google Sheets，Sheet 结构需与 Dashboard 一致

## 数据要求

- **B 区域（A10 起）**：各门店当月数据，第一列为门店名
- **第 20 行起**：6 个月门店佣金排行榜

### 本店 6 个月趋势（二选一）

1. **Apps Script URL**：在配置中填写后，系统会逐月切换 B2 并读取该店数据，汇总为趋势图。需等待约 10 秒。
2. **Monthly_Summary GID**：若已有 Monthly_Summary 透视表（含门店、月份、订单数、结算金额），填写其 gid 可一次性加载，速度更快。

若两者均未配置，将显示全司趋势并提示配置方式。

门店名匹配不区分大小写，支持部分匹配（如 "Celestique" 匹配 "Celestique Spa"、"Luna" 匹配 "Luna Kyoto"）。
