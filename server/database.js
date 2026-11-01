import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));

export function openDatabase(databasePath = process.env.DIGITAL_SURAKSHA_DB_PATH || path.resolve(directory, '../data/digital-suraksha.sqlite')) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const database = new DatabaseSync(databasePath);
  const migrations = [
    `CREATE TABLE IF NOT EXISTS users (
       id TEXT PRIMARY KEY,
       email TEXT NOT NULL UNIQUE,
       password_hash TEXT NOT NULL,
       password_salt TEXT NOT NULL,
       created_at TEXT NOT NULL
     );

     CREATE TABLE IF NOT EXISTS sessions (
       token_hash TEXT PRIMARY KEY,
       csrf_token TEXT NOT NULL,
       user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       expires_at TEXT NOT NULL
     );
     CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
     CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

     CREATE TABLE IF NOT EXISTS analyses (
       id TEXT PRIMARY KEY,
       user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       kind TEXT NOT NULL CHECK(kind IN ('message', 'url')),
       category TEXT NOT NULL,
       score INTEGER,
       details_json TEXT NOT NULL,
       created_at TEXT NOT NULL
     );
     CREATE INDEX IF NOT EXISTS analyses_user_created_idx ON analyses(user_id, created_at DESC);

     CREATE TABLE IF NOT EXISTS assessments (
       id TEXT PRIMARY KEY,
       user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
       answers_json TEXT NOT NULL,
       created_at TEXT NOT NULL
     );
     CREATE INDEX IF NOT EXISTS assessments_user_created_idx ON assessments(user_id, created_at DESC);

     CREATE TABLE IF NOT EXISTS payment_checklists (
       user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
       checks_json TEXT NOT NULL,
       updated_at TEXT NOT NULL
     );`,
  ];
  database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  const currentVersion = database.prepare('PRAGMA user_version').get().user_version;
  if (currentVersion > migrations.length) {
    database.close();
    throw new Error(`Database schema version ${currentVersion} is newer than supported version ${migrations.length}`);
  }
  for (let index = currentVersion; index < migrations.length; index += 1) {
    database.exec('BEGIN IMMEDIATE');
    try {
      database.exec(migrations[index]);
      database.exec(`PRAGMA user_version = ${index + 1};`);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      database.close();
      throw error;
    }
  }
  return database;
}

export function saveAnalysis(database, { id, userId, kind, result, createdAt = new Date().toISOString() }) {
  database.prepare(`
    INSERT INTO analyses (id, user_id, kind, category, score, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, kind, result.category, result.score, JSON.stringify({
    findings: result.findings,
    external: result.external,
    analyzedAt: result.analyzedAt,
  }), createdAt);
}

export function getDashboard(database, userId) {
  const analyses = database.prepare(`
    SELECT kind, COUNT(*) AS total,
      SUM(CASE WHEN category IN ('SUSPICIOUS', 'HIGH RISK') THEN 1 ELSE 0 END) AS suspicious,
      SUM(CASE WHEN category = 'HIGH RISK' THEN 1 ELSE 0 END) AS high_risk
    FROM analyses WHERE user_id = ? GROUP BY kind
  `).all(userId);
  const latestAssessment = database.prepare(`
    SELECT score, created_at AS createdAt
    FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(userId) ?? null;
  const assessmentHistory = database.prepare(`
    SELECT id, score, created_at AS createdAt
    FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(userId);
  const recent = database.prepare(`
    SELECT id, kind, category, score, details_json AS detailsJson, created_at AS createdAt
    FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(userId).map((item) => ({
    ...item,
    findings: JSON.parse(item.detailsJson).findings,
    detailsJson: undefined,
  }));
  const empty = { total: 0, suspicious: 0, highRisk: 0 };
  const message = analyses.find((item) => item.kind === 'message');
  const url = analyses.find((item) => item.kind === 'url');
  return {
    messages: message
      ? { total: message.total, suspicious: message.suspicious, highRisk: message.high_risk }
      : empty,
    urls: url
      ? { total: url.total, suspicious: url.suspicious, highRisk: url.high_risk }
      : empty,
    latestAssessment,
    assessmentHistory,
    recent,
    reportCount: 0,
    reportHistoryAvailable: false,
  };
}
