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
      return emptyResponse(e);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return emptyResponse(e);
    }

    const result = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const d = String(row[0] || '').trim();
      const s = String(row[1] || '').trim();
      if (!d || !s) continue;

      if (!result[d]) result[d] = {};

      const staffName = row[2];
      const staffTime = row[3];
      const storeName = row[4];
      const storeTime = row[5];

      let storeErrors = [];
      try {
        const raw = row[7];
        if (raw && String(raw).trim()) {
          storeErrors = JSON.parse(String(raw));
        }
      } catch (_) {}

      result[d][s] = {
        staff_confirm: staffName && staffTime ? { name: String(staffName), time: String(staffTime) } : null,
        store_confirm: storeName && storeTime ? { name: String(storeName), time: String(storeTime) } : null,
        store_errors: storeErrors
      };
    }

    const params = e && e.parameter ? e.parameter : {};
    const date = params.date || '';
    const store = params.store || '';

    if (date && store) {
      const entry = (result[date] && result[date][store]) || { staff_confirm: null, store_confirm: null, store_errors: [] };
      return ContentService.createTextOutput(JSON.stringify({
        date, store,
        staff_confirm: entry.staff_confirm,
        store_confirm: entry.store_confirm,
        store_errors: entry.store_errors
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (date) {
      return ContentService.createTextOutput(JSON.stringify(result[date] || {}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function emptyResponse(e) {
  const params = e && e.parameter ? e.parameter : {};
  const date = params.date || '';
  const store = params.store || '';
  if (date && store) {
    return ContentService.createTextOutput(JSON.stringify({
      date, store,
      staff_confirm: null,
      store_confirm: null,
      store_errors: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { date, store, role, name, time, errorItems } = body;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Confirmations');
    if (!sheet) {
      sheet = ss.insertSheet('Confirmations');
      sheet.appendRow(['Date', 'Store', 'Staff Name', 'Staff Time', 'Store Name', 'Store Time', 'Cancel History', 'Error Reports']);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#F5F0E6');
    }

    const lastCol = sheet.getLastColumn();
    if (lastCol < 8) {
      const headers = ['Date', 'Store', 'Staff Name', 'Staff Time', 'Store Name', 'Store Time', 'Cancel History', 'Error Reports'];
      for (let c = lastCol; c < 8; c++) {
        sheet.getRange(1, c + 1).setValue(headers[c]);
      }
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#F5F0E6');
    }

    const rows = sheet.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === date && String(rows[i][1]) === store) {
        targetRow = i + 1;
        break;
      }
    }

    let staffName = '', staffTime = '', storeName = '', storeTime = '';
    let storeErrors = [];

    if (role === 'staff') {
      if (targetRow > 0) {
        sheet.getRange(targetRow, 3).setValue(name);
        sheet.getRange(targetRow, 4).setValue(time);
        sheet.getRange(targetRow, 7).setValue('');
      } else {
        sheet.appendRow([date, store, name, time, '', '', '', '']);
      }
      staffName = name;
      staffTime = time;
    } else if (role === 'staff_cancel') {
      if (targetRow > 0) {
        const cancelEntry = name + ' canceled at ' + time;
        const existing = sheet.getRange(targetRow, 7).getValue() || '';
        sheet.getRange(targetRow, 7).setValue(existing ? existing + ' | ' + cancelEntry : cancelEntry);
        sheet.getRange(targetRow, 3).setValue('');
        sheet.getRange(targetRow, 4).setValue('');
        sheet.getRange(targetRow, 8).setValue('');
      }
    } else if (role === 'store') {
      if (targetRow > 0) {
        sheet.getRange(targetRow, 5).setValue(name);
        sheet.getRange(targetRow, 6).setValue(time);
      } else {
        sheet.appendRow([date, store, '', '', name, time, '', '']);
      }
      storeName = name;
      storeTime = time;
    } else if (role === 'store_error') {
      const newErrors = [{ name: name || '', time, items: errorItems || [] }];
      if (targetRow > 0) {
        const existing = sheet.getRange(targetRow, 8).getValue() || '';
        let existingErrors = [];
        try {
          if (existing && String(existing).trim()) {
            existingErrors = JSON.parse(String(existing));
          }
        } catch (_) {}
        storeErrors = existingErrors.concat(newErrors);
        sheet.getRange(targetRow, 8).setValue(JSON.stringify(storeErrors));
      } else {
        storeErrors = newErrors;
        sheet.appendRow([date, store, '', '', '', '', '', JSON.stringify(storeErrors)]);
      }
    }

    // Read back current row state for response
    if (targetRow > 0) {
      const rowData = sheet.getRange(targetRow, 1, 1, 8).getValues()[0];
      if (!staffName) staffName = String(rowData[2] || '');
      if (!staffTime) staffTime = String(rowData[3] || '');
      if (!storeName) storeName = String(rowData[4] || '');
      if (!storeTime) storeTime = String(rowData[5] || '');
      if (storeErrors.length === 0) {
        try {
          const raw = String(rowData[7] || '');
          if (raw) storeErrors = JSON.parse(raw);
        } catch (_) {}
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true, date, store,
      staff_confirm: staffName && staffTime ? { name: staffName, time: staffTime } : null,
      store_confirm: storeName && storeTime ? { name: storeName, time: storeTime } : null,
      store_errors: storeErrors
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
