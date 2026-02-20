# FocusMode Tracker Server

Lokaler SQLite-Server für die FocusMode-Extension.

## Start

```bash
cd tracker-server
npm install
npm start
```

Standard:
- API: `http://127.0.0.1:4545`
- SQLite: `tracker-server/focusmode.db`

## Optionale Umgebungsvariablen

- `PORT=4545`
- `FOCUSMODE_DB_PATH=D:\Pfad\zu\focusmode.db`

## API

- `GET /api/health` Status + Anzahl Sessions
- `POST /api/sessions` Session schreiben
- `GET /api/stats/top?limit=15` Top Domains
- `GET /api/sessions/recent?limit=50` Letzte Sessions
- `GET /api/stats/daily?days=14` Tageswerte
