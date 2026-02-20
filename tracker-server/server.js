import cors from "cors";
import Database from "better-sqlite3";
import express from "express";
import path from "node:path";

const PORT = Number(process.env.PORT || 4545);
const DB_PATH =
  process.env.FOCUSMODE_DB_PATH || path.join(process.cwd(), "focusmode.db");

const app = express();
const db = new Database(DB_PATH);

bootstrapDb();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const insertSessionStmt = db.prepare(`
  INSERT INTO sessions (
    hostname,
    url,
    title,
    started_at,
    ended_at,
    duration_ms,
    reason,
    created_at
  ) VALUES (
    @hostname,
    @url,
    @title,
    @startedAt,
    @endedAt,
    @durationMs,
    @reason,
    @createdAt
  );
`);

const countSessionsStmt = db.prepare(`SELECT COUNT(*) AS count FROM sessions;`);

const topStatsStmt = db.prepare(`
  SELECT
    hostname,
    SUM(duration_ms) AS totalMs,
    COUNT(*) AS visits,
    MAX(ended_at) AS lastVisitAt
  FROM sessions
  GROUP BY hostname
  ORDER BY totalMs DESC
  LIMIT @limit;
`);

const recentSessionsStmt = db.prepare(`
  SELECT
    hostname,
    url,
    title,
    started_at AS startedAt,
    ended_at AS endedAt,
    duration_ms AS durationMs,
    reason
  FROM sessions
  ORDER BY ended_at DESC
  LIMIT @limit;
`);

const dailyStatsStmt = db.prepare(`
  SELECT
    strftime('%Y-%m-%d', ended_at / 1000, 'unixepoch', 'localtime') AS day,
    SUM(duration_ms) AS totalMs,
    COUNT(*) AS sessions
  FROM sessions
  WHERE ended_at >= @fromTs
  GROUP BY day
  ORDER BY day DESC;
`);

app.get("/api/health", (req, res) => {
  const count = countSessionsStmt.get().count;
  res.json({
    ok: true,
    dbPath: DB_PATH,
    totalSessions: count,
    now: Date.now(),
  });
});

app.post("/api/sessions", (req, res) => {
  const body = req.body || {};
  const validation = validateSession(body);

  if (!validation.ok) {
    res.status(400).json({
      ok: false,
      error: validation.error,
    });
    return;
  }

  insertSessionStmt.run({
    hostname: body.hostname,
    url: body.url,
    title: body.title || "",
    startedAt: body.startedAt,
    endedAt: body.endedAt,
    durationMs: body.durationMs,
    reason: body.reason || "unknown",
    createdAt: Date.now(),
  });

  res.status(201).json({ ok: true });
});

app.get("/api/stats/top", (req, res) => {
  const limitRaw = Number(req.query.limit || 15);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 15));
  const rows = topStatsStmt.all({ limit });
  res.json({
    ok: true,
    items: rows,
  });
});

app.get("/api/sessions/recent", (req, res) => {
  const limitRaw = Number(req.query.limit || 50);
  const limit = Math.min(500, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));
  const rows = recentSessionsStmt.all({ limit });
  res.json({
    ok: true,
    items: rows,
  });
});

app.get("/api/stats/daily", (req, res) => {
  const daysRaw = Number(req.query.days || 14);
  const days = Math.min(180, Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 14));
  const fromTs = Date.now() - days * 24 * 60 * 60 * 1000;
  const rows = dailyStatsStmt.all({ fromTs });
  res.json({
    ok: true,
    days,
    items: rows,
  });
});

app.listen(PORT, () => {
  console.log(
    `FocusMode tracker server listening on http://127.0.0.1:${PORT} (DB: ${DB_PATH})`
  );
});

function bootstrapDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostname TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
      reason TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_hostname ON sessions(hostname);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_ended_at ON sessions(ended_at);
  `);
}

function validateSession(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }

  if (typeof input.hostname !== "string" || input.hostname.trim() === "") {
    return { ok: false, error: "hostname is required" };
  }

  if (typeof input.url !== "string" || input.url.trim() === "") {
    return { ok: false, error: "url is required" };
  }

  if (!isFiniteNumber(input.startedAt) || !isFiniteNumber(input.endedAt)) {
    return { ok: false, error: "startedAt and endedAt must be numbers" };
  }

  if (!isFiniteNumber(input.durationMs) || input.durationMs < 0) {
    return { ok: false, error: "durationMs must be a positive number" };
  }

  return { ok: true };
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
