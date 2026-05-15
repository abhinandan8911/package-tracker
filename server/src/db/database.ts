import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'tracker.db');

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'migrations', '001_initial.sql'),
  'utf8'
);
db.exec(migrationSQL);

export default db;
