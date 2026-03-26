function doGet(e) {
  const sheetId = "1pTrKbY3BRJjCB3N2lE01zGIw5fILgiB9hV4vSA3sdpM";
  const ss = SpreadsheetApp.openById(sheetId);

  const page = e.parameter.page || "main";

  if (page === "main") {
    const sh = ss.getSheets()[0];

    const data = {
      today: sh.getRange("B1").getValue(),
      yesterday: sh.getRange("B2").getValue(),
      month: sh.getRange("B3").getValue(),

      balance: sh.getRange("B5").getValue(),
      debt: sh.getRange("B6").getValue(),

      need: sh.getRange("B8").getValue(),

      // ВАЖНО: сейф в C10
      safe: sh.getRange("C10").getValue(),

      reminder: sh.getRange("B12").getValue(),

      todayTasks: sh.getRange("J2:J200").getValues().flat().filter(v => v),
      tomorrowTasks: sh.getRange("K2:K200").getValues().flat().filter(v => v)
    };

    return jsonp(data, e);
  }

  if (page === "income") {
    const shMain = ss.getSheets()[0];
    const sh = ss.getSheets()[1];

    const rows = sh.getRange("A2:B200").getValues();

    const clean = rows.filter(r => r[0] && r[1]);

    const data = {
      today: shMain.getRange("B1").getValue(),
      yesterday: shMain.getRange("B2").getValue(),
      month: shMain.getRange("B3").getValue(),

      rows: clean
    };

    return jsonp(data, e);
  }
}

function jsonp(data, e) {
  const callback = e.parameter.callback || "callback";
  return ContentService
    .createTextOutput(callback + "(" + JSON.stringify(data) + ")")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}