/**
 * iPad Dashboard v2
 * J — дела на сегодня
 * K — дела на завтра
 * Используются 2 листа по gid, которые ты дал.
 * Если какие-то цифры лежат в других ячейках — просто поменяй CONFIG.
 */
var CONFIG = {
  MAIN_GID: 0,
  INCOME_GID: 1262080830,
  MAIN: {
    TASKS_TODAY_RANGE: "J2:J50",
    TASKS_TOMORROW_RANGE: "K2:K50",
    INCOME_YESTERDAY_CELL: "B2",
    INCOME_TODAY_CELL: "B3",
    INCOME_MONTH_CELL: "B4",
    BALANCE_CELL: "B5",
    DEBT_CELL: "B6",
    SAFE_CELL: "B7",
    GOAL_NEED_LABEL_CELL: "A9",
    GOAL_NEED_VALUE_CELL: "B9",
    GOAL_RECOMMENDED_LABEL_CELL: "A10",
    GOAL_RECOMMENDED_VALUE_CELL: "B10",
    REMINDER_CELL: "A12"
  },
  INCOME: {
    INCOME_YESTERDAY_CELL: "B2",
    INCOME_TODAY_CELL: "B3",
    INCOME_MONTH_CELL: "B4",
    CHART_LABELS_COL: "A",
    CHART_VALUES_COL: "B",
    CHART_START_ROW: 2,
    CHART_END_ROW: 60
  }
};

function doGet(e) {
  var cb = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : "";
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : "main";
  var payload = page === "income" ? getIncomeData_() : getMainData_();
  var json = JSON.stringify(payload);
  if (cb) {
    return ContentService.createTextOutput(cb + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getMainData_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getSheetByGid_(ss, CONFIG.MAIN_GID);
  var c = CONFIG.MAIN;
  return {
    income_yesterday: getCell_(sh, c.INCOME_YESTERDAY_CELL),
    income_today: getCell_(sh, c.INCOME_TODAY_CELL),
    income_month: getCell_(sh, c.INCOME_MONTH_CELL),
    balance: getCell_(sh, c.BALANCE_CELL),
    debt: getCell_(sh, c.DEBT_CELL),
    safe: getCell_(sh, c.SAFE_CELL),
    goal_need_label: getCell_(sh, c.GOAL_NEED_LABEL_CELL),
    goal_need_value: getCell_(sh, c.GOAL_NEED_VALUE_CELL),
    goal_recommended_label: getCell_(sh, c.GOAL_RECOMMENDED_LABEL_CELL),
    goal_recommended_value: getCell_(sh, c.GOAL_RECOMMENDED_VALUE_CELL),
    reminder: getCell_(sh, c.REMINDER_CELL),
    tasks_today: getList_(sh, c.TASKS_TODAY_RANGE),
    tasks_tomorrow: getList_(sh, c.TASKS_TOMORROW_RANGE),
    updated_at: formatNow_()
  };
}

function getIncomeData_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getSheetByGid_(ss, CONFIG.INCOME_GID);
  var c = CONFIG.INCOME;
  return {
    income_yesterday: getCell_(sh, c.INCOME_YESTERDAY_CELL),
    income_today: getCell_(sh, c.INCOME_TODAY_CELL),
    income_month: getCell_(sh, c.INCOME_MONTH_CELL),
    chart_points: getChartPoints_(sh, c.CHART_LABELS_COL, c.CHART_VALUES_COL, c.CHART_START_ROW, c.CHART_END_ROW),
    updated_at: formatNow_()
  };
}

function getSheetByGid_(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() == gid) return sheets[i];
  }
  throw new Error("Лист с gid=" + gid + " не найден");
}

function getCell_(sh, a1) {
  return sh.getRange(a1).getDisplayValue();
}

function getList_(sh, rangeA1) {
  var vals = sh.getRange(rangeA1).getDisplayValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var v = (vals[i][0] || "").toString().trim();
    if (v) out.push(v);
  }
  return out;
}

function getChartPoints_(sh, labelsCol, valuesCol, startRow, endRow) {
  var out = [];
  for (var r = startRow; r <= endRow; r++) {
    var label = sh.getRange(labelsCol + r).getDisplayValue();
    var value = sh.getRange(valuesCol + r).getDisplayValue();
    if ((label || "").toString().trim() === "" && (value || "").toString().trim() === "") continue;
    out.push({ label: label, value: value });
  }
  return out;
}

function formatNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm:ss");
}
