import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _db;
}

// Initialize users table
export async function initDb() {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      casdoor_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
