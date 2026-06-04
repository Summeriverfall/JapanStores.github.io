# 运营数据仪表盘使用说明

## 功能概述

这个仪表盘可以从 Google Sheets 读取数据并可视化展示，支持查看不同月份的运营数据。

## 数据源结构

您的 Google Sheets 结构：
- **Dashboard** sheet：主仪表盘
  - A2:B6：根据 B2 选择的月份显示当月订单、人数、项目金额、结算金额
  - A10:E16：根据 B2 月份显示各门店数据和占比
  - K1:M2：累计数据（订单数、项目金额、结算金额）
- **Helper** sheet：日期数据源
- **Monthly_Summary** sheet：透视表，数据来自 Orders_Raw
- **Orders_Raw** sheet：原始订单数据

## 两种实现方案

### 方案1：使用 Google Apps Script（推荐）✅

**优点：**
- 不需要修改现有的 Google Sheets 结构
- 可以直接在网页上更改月份
- 数据实时更新

**设置步骤：**

1. **创建 Google Apps Script**
   - 在 Google Sheets 中，点击 **扩展程序** → **Apps Script**
   - 复制以下代码：

```javascript
function doGet(e) {
  const sheetId = e.parameter.sheetId;
  const month = e.parameter.month;
  const action = e.parameter.action;
  
  if (action === 'updateMonth') {
    try {
      const ss = SpreadsheetApp.openById(sheetId);
      const dashboardSheet = ss.getSheetByName('Dashboard');
      
      if (!dashboardSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: '找不到 Dashboard sheet'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // 更新 B2 单元格为选择的月份
      // 格式：YYYY-MM-DD（使用该月第一天）
      dashboardSheet.getRange('B2').setValue(month);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: '月份已更新'
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: '未知操作'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

2. **部署为 Web 应用**
   - 点击 **部署** → **新建部署**
   - 选择类型：**网页应用**
   - 执行身份：**我**
   - 访问权限：**任何人**
   - 点击 **部署**
   - 复制生成的 **Web 应用 URL**

3. **在仪表盘中配置**
   - 打开仪表盘页面
   - 加载 Google Sheets 数据
   - 在"Google Apps Script URL"输入框中粘贴 Web 应用 URL
   - 现在您可以直接在网页上选择月份并更新数据

### 方案2：创建分月份的 Sheet

**优点：**
- 不需要 Apps Script
- 设置简单

**缺点：**
- 需要修改 Google Sheets 结构
- 需要为每个月份创建单独的 sheet

**设置步骤：**

1. **在 Google Sheets 中创建分月份的 Sheet**
   - 为每个月份创建一个 sheet（如：2024-01、2024-02 等）
   - 每个 sheet 的结构与 Dashboard 相同
   - 每个 sheet 的 B2 单元格设置为对应月份

2. **在仪表盘中切换 Sheet**
   - 加载 Google Sheets 数据时，输入对应月份的 sheet 名称
   - 或者使用包含 gid 的 URL

## 使用流程

### 使用方案1（推荐）

1. 设置 Google Apps Script（如上所述）
2. 打开仪表盘页面
3. 输入 Google Sheets 链接
4. 输入 sheet 名称："Dashboard"
5. 点击"加载数据"
6. 在"Google Apps Script URL"中输入部署的 Web 应用 URL
7. 选择月份，点击"更新数据"
8. 系统会自动更新 B2 单元格并加载对应月份的数据

### 使用方案2

1. 在 Google Sheets 中创建分月份的 sheet
2. 打开仪表盘页面
3. 输入 Google Sheets 链接
4. 输入对应月份的 sheet 名称（如："2024-01"）
5. 点击"加载数据"
6. 查看该月份的数据

## 注意事项

1. **Google Sheets 权限**：确保 Google Sheets 已设置为"任何拥有链接的人都可以查看"
2. **Apps Script 权限**：部署 Apps Script 时，访问权限必须选择"任何人"
3. **数据更新延迟**：使用 Apps Script 更新后，可能需要等待 1-2 秒让 Google Sheets 的公式重新计算
4. **月份格式**：月份格式为 YYYY-MM（如：2024-01）

## 数据区域说明

- **A区域（A2:B6）**：当月数据统计卡片
- **B区域（A10:E16）**：各门店数据图表和表格
- **C区域（K2:M2）**：累计数据统计卡片
- **趋势区域（G1:I7）**：最近六个月订单/结算金额趋势
- **6个月门店佣金排行榜（第20行起）**：从第20行开始添加表格，列包含「门店」和「6个月佣金/结算金额」，系统将按佣金从高到低排序显示排行榜
- **月份选择器（B2）**：控制所有数据的月份

## 故障排除

1. **无法加载数据**
   - 检查 Google Sheets 是否设置为公开访问
   - 检查 sheet 名称是否正确
   - 检查 URL 中是否包含正确的 gid

2. **月份更新失败**
   - 检查 Apps Script URL 是否正确
   - 检查 Apps Script 是否已部署为 Web 应用
   - 检查访问权限是否设置为"任何人"

3. **数据显示不正确**
   - 检查 Google Sheets 中的公式是否正确
   - 检查数据区域是否正确（A2:B6、A10:E16、K2:M2）
   - 检查 B2 单元格的月份格式是否正确
