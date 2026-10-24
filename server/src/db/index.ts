import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

// Garante resolução flexível do diretório data e caminho do banco SQLite
const dbUrl = process.env.DATABASE_URL?.replace('file:', '');
let resolvedDbPath: string;

if (dbUrl) {
  resolvedDbPath = path.isAbsolute(dbUrl) ? dbUrl : path.resolve(process.cwd(), dbUrl);
  const parentDir = path.dirname(resolvedDbPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
} else {
  // Busca pasta data na raiz do workspace ou relativa
  const rootDataDir = path.resolve(process.cwd(), 'data');
  const parentDataDir = path.resolve(process.cwd(), '../data');
  const targetDataDir = fs.existsSync(rootDataDir) ? rootDataDir : parentDataDir;
  if (!fs.existsSync(targetDataDir)) {
    fs.mkdirSync(targetDataDir, { recursive: true });
  }
  resolvedDbPath = path.join(targetDataDir, 'saas_validator.db');
}

// Cria ou abre conexão SQLite
export const db = new DatabaseSync(resolvedDbPath);

// Configurações de alta performance e integridade ACID
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
`);

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const stmt = db.prepare(sql);
  const result = stmt.get(...params);
  return (result as T) || null;
}

export function execute(sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
