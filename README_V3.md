# Dashboard v3

Внутри:
- index.html
- income.html
- apps_script.gs

Уже подставлен Web App URL:
https://script.google.com/macros/s/AKfycbwI-yuwuNLx0mFVocA43t_N1CKe7I1-yVRd1d2PVVhoQqZNyQT8zCa_G-m9UaVQHrFPZA/exec

Главная:
- B1 — доход за сегодня
- B2 — доход за вчера
- B3 — доход за месяц
- B5 — баланс
- B6 — долг
- B8 — необходимо заработать до 19 апреля 2026 года
- B10 — сейф
- B12 — главное напоминание
- J2:J200 — дела на сегодня
- K2:K200 — дела на завтра

Страница дохода:
- A2:A200 — дата
- B2:B200 — сумма
- график + таблица + общая сумма

Что сделать:
1. Заменить files в GitHub:
   - index.html
   - income.html
2. Заменить код в Apps Script:
   - apps_script.gs
3. В Apps Script сделать:
   Deploy -> Manage deployments -> Edit -> New version -> Deploy
