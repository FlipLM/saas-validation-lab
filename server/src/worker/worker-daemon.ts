import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { Worker } from './worker.js';

console.log('[WORKER DAEMON] Inicializando serviço de execução assíncrona em segundo plano...');
const worker = new Worker();
let isRunning = true;

const pollIntervalMs = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '3000', 10);

async function loop() {
  while (isRunning) {
    try {
      const processed = await worker.processNextJob();
      if (!processed) {
        // Sem jobs na fila, aguarda intervalo de polling
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    } catch (err) {
      console.error('[WORKER DAEMON] Erro no loop de processamento:', err);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }
  console.log('[WORKER DAEMON] Serviço encerrado graciosamente.');
}

// Tratamento de encerramento controlado
process.on('SIGINT', () => {
  console.log('[WORKER DAEMON] Sinal SIGINT recebido. Encerrando...');
  isRunning = false;
});
process.on('SIGTERM', () => {
  console.log('[WORKER DAEMON] Sinal SIGTERM recebido. Encerrando...');
  isRunning = false;
});

loop();
