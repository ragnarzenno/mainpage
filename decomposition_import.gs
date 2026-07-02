/**
 * Декомпозиция — заполнение таблицы по шаблону.
 * Как запустить:
 *   1) Открой свою целевую Google-таблицу
 *   2) Extensions → Apps Script
 *   3) Вставь этот код, сохрани
 *   4) Выбери функцию buildDecomposition → Run (при первом запуске подтверди доступ)
 * Скрипт создаст листы «Декомпозиция» и «Доп. расчёты» и заполнит их.
 * Все цифры правятся на листе «Доп. расчёты» (курс $, средний чек, цель) — остальное пересчитается.
 */
function buildDecomposition() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var RATE = 80;      // курс $
  var AVG  = 87500;   // средний чек заказа (делегирование)
  var GOAL = 750000;  // цель дохода / мес

  var GOLD = '#d1b16a', HEAD = '#1b2230', TOTAL = '#efe7cf';

  // ---------- Лист «Доп. расчёты» ----------
  var aux = ss.getSheetByName('Доп. расчёты') || ss.insertSheet('Доп. расчёты');
  aux.clear();
  aux.getRange('A1').setValue('ПАРАМЕТРЫ И РАСЧЁТЫ').setFontWeight('bold').setFontSize(13).setFontColor(GOLD).setBackground(HEAD);
  aux.getRange('A1:C1').merge();
  aux.getRange(2, 1, 3, 2).setValues([
    ['Курс $ (₽)', RATE],
    ['Средний чек заказа (делегирование), ₽', AVG],
    ['Цель дохода / мес, ₽', GOAL]
  ]);
  aux.getRange('B2:B4').setFontWeight('bold');

  aux.getRange('A6').setValue('ФАКТ (сейчас)').setFontWeight('bold');
  aux.getRange(7, 1, 1, 3).setValues([['источник', 'ед./мес (факт)', 'доход факт/мес']]).setFontWeight('bold').setBackground(HEAD).setFontColor('#ffffff');
  aux.getRange(8, 1, 5, 3).setValues([
    ['Гипнотерапия', 4, "=B8*'Декомпозиция'!F3"],
    ['Автоматизация — делегирование (30%)', 3.5, "=B9*'Декомпозиция'!F4"],
    ['Автоматизация — почасовая (2 клиента)', 43.3, "=B10*'Декомпозиция'!F5"],
    ['Академия / проекты RealMind', 0, "=B11*'Декомпозиция'!F6"],
    ['ИТОГО факт', '', '=SUM(C8:C11)']
  ]);
  aux.getRange('A12:C12').setFontWeight('bold').setBackground(TOTAL);
  aux.getRange('A14').setValue('Профицит сейчас (доход факт − расходы)').setFontWeight('bold');
  aux.getRange('B14').setFormula("=C12-'Декомпозиция'!B18").setFontWeight('bold');
  aux.getRange('A15').setValue('До цели (цель − доход факт)').setFontWeight('bold');
  aux.getRange('B15').setFormula('=B4-C12').setFontWeight('bold');

  var notes = [
    ['ПОЯСНЕНИЯ:'],
    ['• «штук в месяц» = цель дохода ÷ стоимость единицы (сколько продать ЭТОГО, чтобы одному каналу закрыть всю цель).'],
    ['• Гипнотерапия: $150 × курс. Средний чек делегирования 87 500 → 30% = 26 250 ₽/заказ.'],
    ['• 1 заказ делегирования идёт 2–3 недели → рост числа заказов только через делегатов (параллельные потоки).'],
    ['• RealMind/Академия: цена проекта 50 000 ₽ — ЗАГЛУШКА, поставь реальную.'],
    ['• Долги 22 200 = 266 400 ₽ ÷ 12 мес. Жильё = 0 (допущение).']
  ];
  aux.getRange(17, 1, notes.length, 1).setValues(notes);
  aux.getRange('A17').setFontWeight('bold');
  aux.getRange(17, 1, notes.length, 1).setFontColor('#8a6d3b');
  aux.setColumnWidth(1, 340); aux.setColumnWidth(2, 130); aux.setColumnWidth(3, 150);

  // ---------- Лист «Декомпозиция» ----------
  var sh = ss.getSheetByName('Декомпозиция') || ss.insertSheet('Декомпозиция');
  sh.clear();
  sh.getRange('A1:G1').merge().setValue('декомпозиция')
    .setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center')
    .setBackground(HEAD).setFontColor(GOLD);

  // Заголовки
  sh.getRange('A2').setValue('статья расхода');
  sh.getRange('B2').setValue('сумма, ₽/мес');
  sh.getRange(2, 4, 1, 4).setValues([['№', 'источники дохода', 'стоимость ежемесячно', 'штук в месяц']]);
  sh.getRange('A2:B2').setFontWeight('bold').setBackground(HEAD).setFontColor('#ffffff');
  sh.getRange('D2:G2').setFontWeight('bold').setBackground(HEAD).setFontColor('#ffffff').setWrap(true).setHorizontalAlignment('center');

  // Расходы (A3:B17)
  var expenses = [
    ['жильё (аренда, ипотека, платежи)', 0],
    ['долги, кредиты, рассрочки', 22200],
    ['инвестиции в себя (обучение, спорт, творчество)', 3000],
    ['здоровье (бады, обследования, массажи, процедуры)', 4000],
    ['транспорт (аренда, замена расходников, топливо)', 2500],
    ['одежда, аксессуары, косметика, уход за собой', 1500],
    ['гаджеты (телефоны, камеры, связь, интернет)', 0],
    ['бизнес (только личный бренд)', 0],
    ['питание (продукты, кафе, рестораны, доставка)', 15000],
    ['подарки (себе, родным, друзьям) — ДР, праздники', 5000],
    ['отдых (выходные, отпуск)', 0],
    ['путешествия', 0],
    ['подписки услуг (приложения, музыка, кино)', 500],
    ['визы (визараны)', 20000],
    ['благотворительность', 20000]
  ];
  sh.getRange(3, 1, expenses.length, 2).setValues(expenses);
  var totalRow = 3 + expenses.length; // 18
  sh.getRange(totalRow, 1).setValue('итого:').setFontWeight('bold');
  sh.getRange(totalRow, 2).setFormula('=SUM(B3:B' + (totalRow - 1) + ')').setFontWeight('bold');
  sh.getRange(totalRow, 1, 1, 2).setBackground(TOTAL);
  sh.getRange(3, 2, expenses.length + 1, 1).setNumberFormat('# ##0" ₽"');

  // Источники дохода (D3:G6)
  var income = [
    [1, 'Гипнотерапия',                                   "='Доп. расчёты'!$B$2*150"],
    [2, 'Автоматизация — делегирование процессов (30%)',  "=0.3*'Доп. расчёты'!$B$3"],
    [3, 'Автоматизация — почасовая (2 клиента)',          2500],
    [4, 'Академия / проекты RealMind',                    50000]
  ];
  for (var i = 0; i < income.length; i++) {
    var r = 3 + i;
    sh.getRange(r, 4).setValue(income[i][0]);
    sh.getRange(r, 5).setValue(income[i][1]);
    sh.getRange(r, 6).setValue(income[i][2]);
    sh.getRange(r, 7).setFormula("=ROUND('Доп. расчёты'!$B$4/F" + r + ",1)");
  }
  var incTotalRow = 3 + income.length; // 7
  sh.getRange(incTotalRow, 5).setValue('итого (цель дохода):').setFontWeight('bold');
  sh.getRange(incTotalRow, 6).setFormula("='Доп. расчёты'!$B$4").setFontWeight('bold');
  sh.getRange(incTotalRow, 4, 1, 4).setBackground(TOTAL);
  sh.getRange(3, 6, income.length + 1, 1).setNumberFormat('# ##0" ₽"');

  // Оформление
  sh.getRange(2, 1, totalRow - 1, 2).setBorder(true, true, true, true, true, true);
  sh.getRange(2, 4, incTotalRow - 1, 4).setBorder(true, true, true, true, true, true);
  sh.setColumnWidth(1, 320); sh.setColumnWidth(2, 120); sh.setColumnWidth(3, 24);
  sh.setColumnWidth(4, 34);  sh.setColumnWidth(5, 300); sh.setColumnWidth(6, 150); sh.setColumnWidth(7, 110);
  sh.setFrozenRows(2);

  SpreadsheetApp.getActiveSpreadsheet().toast('Готово: листы «Декомпозиция» и «Доп. расчёты» заполнены.');
}
