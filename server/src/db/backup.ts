import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), '../data');
const backupsDir = path.join(dataDir, 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const sourceDb = path.join(dataDir, 'saas_validator.db');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const targetBackup = path.join(backupsDir, `saas_validator_backup_${timestamp}.db`);

if (fs.existsSync(sourceDb)) {
  fs.copyFileSync(sourceDb, targetBackup);
  console.log(`[BACKUP] Snapshot consistente do banco criado com sucesso em: ${targetBackup}`);
} else {
  console.error(`[BACKUP ERROR] Arquivo de banco de dados não encontrado em: ${sourceDb}`);
  process.exit(1);
}
