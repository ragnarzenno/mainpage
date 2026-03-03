/**
 * iPad Dashboard — Google Apps Script (JSONP)
 *
 * Таблица:
 *  - Лист: dashboard
 *  - B2: income_today
 *  - B3: income_month
 *  - B4: income_total
 *  - A7:A20: tasks_today
 *  - C7:C20: goals_global
 *  - B22: quote_text
 *  - B23: quote_author
 *
 * Деплой:
 *  Deploy → New deployment → Web app
 *   - Execute as: Me
 *   - Who has access: Anyone
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('dashboard');
  if (!sh) return output_(e, { ok:false, error:'Sheet "dashboard" not found' });

  var incomeToday = sh.getRange('B2').getDisplayValue();
  var incomeMonth = sh.getRange('B3').getDisplayValue();
  var incomeTotal = sh.getRange('B4').getDisplayValue();

  var tasks = list_(sh.getRange('A7:A20').getDisplayValues());
  var goals = list_(sh.getRange('C7:C20').getDisplayValues());

  var quoteText = sh.getRange('B22').getDisplayValue();
  var quoteAuthor = sh.getRange('B23').getDisplayValue();

  var now = new Date();
  var updatedAt = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');

  var payload = {
    ok: true,
    income_today: incomeToday,
    income_month: incomeMonth,
    income_total: incomeTotal,
    tasks_today: tasks,
    goals_global: goals,
    quote: { text: quoteText, author: quoteAuthor },
    updated_at: updatedAt
  };

  return output_(e, payload);
}

function list_(values2d){
  var out = [];
  for (var i=0;i<values2d.length;i++){
    var v = (values2d[i][0]||'').toString().trim();
    if (v) out.push(v);
  }
  return out;
}

function output_(e, obj){
  var json = JSON.stringify(obj);
  var cb = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : '';
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
