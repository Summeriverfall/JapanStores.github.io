// 部署步骤：
// 1. 在 Google Drive 中新建一个 Google Sheet，命名为 "Confirmations" 或任意名称
// 2. 打开该 Sheet → 扩展程序 → Apps Script
// 3. 将本文件全部代码粘贴进去（替换默认的 myFunction）
// 4. 点击"部署" → "新部署" → 类型选"Web 应用"
// 5. "执行身份"选"我"，"访问权限"选"任何人"
// 6. 部署后复制 URL，设为 Render 的环境变量 GOOGLE_SCRIPT_URL

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Confirmations');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: data.length - 1 }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { date, store, role, name, time, errorItems } = data;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Confirmations');
    if (!sheet) {
      sheet = ss.insertSheet('Confirmations');
      sheet.appendRow(['Date', 'Store', 'Staff Name', 'Staff Time', 'Store Name', 'Store Time', 'Cancel History', 'Error Reports']);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#F5F0E6');
    }

    // Ensure all 8 columns exist (migrate old sheets)
    const lastCol = sheet.getLastColumn();
    if (lastCol < 8) {
      if (lastCol < 6) { sheet.getRange(1, 6).setValue('Store Name'); }
      if (lastCol < 7) { sheet.getRange(1, 7).setValue('Cancel History'); }
      sheet.getRange(1, 8).setValue('Error Reports');
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#F5F0E6');
    }

    // 查找已有行
    const rows = sheet.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === date && String(rows[i][1]) === store) {
        targetRow = i + 1;
        break;
      }
    }

    if (role === 'staff') {
      if (targetRow > 0) {
        sheet.getRange(targetRow, 3).setValue(name);
        sheet.getRange(targetRow, 4).setValue(time);
        // Clear cancel history when re-confirming
        sheet.getRange(targetRow, 7).setValue('');
      } else {
        sheet.appendRow([date, store, name, time, '', '', '', '']);
      }
    } else if (role === 'staff_cancel') {
      if (targetRow > 0) {
        const cancelEntry = name + ' canceled at ' + time;
        const existing = sheet.getRange(targetRow, 7).getValue() || '';
        sheet.getRange(targetRow, 7).setValue(existing ? existing + ' | ' + cancelEntry : cancelEntry);
        sheet.getRange(targetRow, 3).setValue('');
        sheet.getRange(targetRow, 4).setValue('');
      }
    } else if (role === 'store') {
      if (targetRow > 0) {
        sheet.getRange(targetRow, 5).setValue(name);
        sheet.getRange(targetRow, 6).setValue(time);
      } else {
        sheet.appendRow([date, store, '', '', name, time, '', '']);
      }
    } else if (role === 'store_error') {
      const itemStr = (errorItems && errorItems.length > 0) ? 'items: ' + errorItems.join(', ') : '';
      const errEntry = name + ' reported errors at ' + time + (itemStr ? ' (' + itemStr + ')' : '');
      if (targetRow > 0) {
        const existing = sheet.getRange(targetRow, 8).getValue() || '';
        sheet.getRange(targetRow, 8).setValue(existing ? existing + ' | ' + errEntry : errEntry);
      } else {
        sheet.appendRow([date, store, '', '', '', '', '', errEntry]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
