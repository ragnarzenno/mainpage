# iPad Dashboard v2

## Что внутри
- index.html — главная страница
- income.html — отдельная страница дохода
- apps_script.gs — Apps Script backend

## Что уже учтено
- J = дела на сегодня
- K = дела на завтра
- переходы между страницами обычными ссылками
- 2 листа по gid:
  - main = 0
  - income = 1262080830

## Что, возможно, надо подправить
Я не могу открыть твой Google Sheet напрямую из этого чата, поэтому адреса некоторых ячеек поставил как рабочие шаблоны.
Смотри блок CONFIG в apps_script.gs.

Если цифры лежат не там — поменяй:
- INCOME_YESTERDAY_CELL
- INCOME_TODAY_CELL
- INCOME_MONTH_CELL
- BALANCE_CELL
- DEBT_CELL
- SAFE_CELL
- GOAL_*_CELL
- REMINDER_CELL

## График
Сейчас график берёт:
- подписи X: колонка A
- значения Y: колонка B
- строки 2..60

Если у тебя график в других колонках — поменяй:
- CHART_LABELS_COL
- CHART_VALUES_COL
- CHART_START_ROW
- CHART_END_ROW

## Как подключить
1. Вставь новый apps_script.gs в Apps Script
2. Разверни как Web App
3. Возьми URL
4. Вставь один и тот же URL в index.html и income.html:
   GAS_WEBAPP_URL = "..."
