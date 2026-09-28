# iPad 4 Dashboard (без jailbreak)

## Доступ к данным по ключу
Apps Script отдаёт данные только с ключом. Ключ лежит в свойствах скрипта под именем `ACCESS_KEY`, в репозитории его нет.

Дашборд берёт ключ из ссылки и запоминает его на устройстве:

    https://ragnarzenno.github.io/mainpage/?k=КЛЮЧ

Без ключа или с неверным ключом дашборд пишет «нет доступа». Пока `ACCESS_KEY` не задан, скрипт отдаёт данные всем, как раньше.

Сменить ключ: поменять `ACCESS_KEY` в настройках проекта Apps Script и открыть дашборд по ссылке с новым ключом. Новый деплой для этого не нужен.


## Что это
Веб‑дашборд (доход + задачи + цели + мотивация), который:
- работает на iPad 4 / iOS 10
- обновляется автоматически (по умолчанию раз в 30 секунд)
- при запуске с «На экран Домой» открывается без адресной строки (почти как приложение)

## 1) Источник данных: Google Sheets + Apps Script (JSONP)
1) Создай Google Sheet
2) Создай лист `dashboard`
3) Заполни:
   - B2: income_today
   - B3: income_month
   - B4: income_total
   - A7:A20: tasks_today
   - C7:C20: goals_global
   - B22: quote_text
   - B23: quote_author
4) Extensions → Apps Script
5) Вставь код из `apps_script.gs`
6) Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
7) Скопируй Web app URL

## 2) Дашборд: index.html
Открой `index.html` и вставь URL в:
  GAS_WEBAPP_URL = "..."

## 3) Где разместить index.html
### Вариант A (рекомендуется): GitHub Pages (бесплатно)
- Залей index.html в репозиторий
- Включи Pages (Settings → Pages)
- Открой ссылку на iPad

### Вариант B: мини‑сервер на ПК (в одной Wi‑Fi)
В папке с index.html:
  python -m http.server 8080
Открой на iPad:
  http://IP_ПК:8080/

## 4) Запуск «во весь экран»
На iPad:
Safari → открыть страницу → Поделиться → На экран Домой → открыть с иконки.
