import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { openDatabase } from '../server/database.js';

test('SQLite initializes a versioned schema and persists it across reopen', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'digital-suraksha-db-'));
  const databasePath = path.join(directory, 'test.sqlite');
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const first = openDatabase(databasePath);
  assert.equal(first.prepare('PRAGMA user_version').get().user_version, 1);
  first.prepare('INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)')
    .run('test-user', 'test@example.test', 'hash', 'salt', new Date().toISOString());
  first.close();

  const reopened = openDatabase(databasePath);
  try {
    assert.equal(reopened.prepare('PRAGMA user_version').get().user_version, 1);
    assert.equal(reopened.prepare('SELECT email FROM users WHERE id = ?').get('test-user').email, 'test@example.test');
  } finally {
    reopened.close();
  }
});
