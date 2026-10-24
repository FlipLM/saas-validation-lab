import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { Orchestrator } from './orchestrator.js';

console.log('[ORCHESTRATOR DAEMON] Inicializando serviço de orquestração autônoma...');
const orchestrator = new Orchestrator();
let isRunning = true;

const intervalMs = parseInt(process.env.ORCHESTRATOR_INTERVAL_MS || '10000', 10);

async function loop() {
  while (isRunning) {
    try {
      const stats = await orchestrator.runCycle();
      if (stats.tasksEnqueued > 0 || stats.zombiesRecovered > 0 || stats.approvalsRequested > 0) {
        console.log(`[ORCHESTRATOR DAEMON] Ciclo concluído: ${stats.tasksEnqueued} tarefas enfileiradas, ${stats.zombiesRecovered} jobs recuperados, ${stats.approvalsRequested} aprovações solicitadas.`);
      }
    } catch (err) {
      console.error('[ORCHESTRATOR DAEMON] Erro no ciclo de orquestração:', err);
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  console.log('[ORCHESTRATOR DAEMON] Serviço encerrado graciosamente.');
}

process.on('SIGINT', () => { isRunning = false; });
process.on('SIGTERM', () => { isRunning = false; });

loop();
