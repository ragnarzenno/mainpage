/**
 * Dashboard v3
 *
 * Главная:
 * B1 — доход за сегодня
 * B2 — доход за вчера
 * B3 — доход за месяц
 * B5 — баланс
 * B6 — долг
 * B8 — необходимо заработать до 19 апреля 2026 года
 * B10 — сейф
 * B12 — главное напоминание
 * J2:J — дела на сегодня
 * K2:K — дела на завтра
 *
 * Вторая страница:
 * A2:A — дата
 * B2:B — сумма
 */
var CONFIG = {
  MAIN_GID: 0,
  INCOME_GID: 1262080830,
  MAIN: {
    INCOME_TODAY_CELL: "B1",
    INCOME_YESTERDAY_CELL: "B2",
    INCOME_MONTH_CELL: "B3",
    BALANCE_CELL: "B5",
    DEBT_CELL: "B6",
    GOAL_NEED_VALUE_CELL: "B8",
    SAFE_CELL: "B10",
    REMINDER_CELL: "B12",
    TASKS_TODAY_RANGE: "J2:J200",
    TASKS_TOMORROW_RANGE: "K2:K200"
  },
  INCOME: {
    INCOME_YESTERDAY_CELL: "B2",
    INCOME_TODAY_CELL: "B1",
    INCOME_MONTH_CELL: "B3",
    CHART_LABELS_COL: "A",
    CHART_VALUES_COL: "B",
    CHART_START_ROW: 2,
    CHART_END_ROW: 200
  }
};

function doGet(e) {
  var cb = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : "";
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : "main";
  var payload = page === "income" ? getIncomeData_() : getMainData_();
  var json = JSON.stringify(payload);

  if (cb) {
    return ContentService
      .createTextOutput(cb + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
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
    goal_need_value: getCell_(sh, c.GOAL_NEED_VALUE_CELL),
    safe: getCell_(sh, c.SAFE_CELL),
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
  var points = getChartPoints_(sh, c.CHART_LABELS_COL, c.CHART_VALUES_COL, c.CHART_START_ROW, c.CHART_END_ROW);

  return {
    income_yesterday: getCell_(sh, c.INCOME_YESTERDAY_CELL),
    income_today: getCell_(sh, c.INCOME_TODAY_CELL),
    income_month: getCell_(sh, c.INCOME_MONTH_CELL),
    income_total: sumPoints_(points),
    chart_points: points,
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

    out.push({
      label: label,
      value: value
    });
  }
  return out;
}

function sumPoints_(points) {
  var sum = 0;
  for (var i = 0; i < points.length; i++) {
    var v = ("" + points[i].value).replace(/\s+/g, "").replace(",", ".");
    var n = parseFloat(v);
    if (!isNaN(n)) sum += n;
  }
  return sum.toFixed(2).replace(".", ",");
}

function formatNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm:ss");
}
