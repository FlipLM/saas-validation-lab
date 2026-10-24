import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback local

import { runMigrations } from './db/migrations.js';
import { runSeeds } from './db/seeds/index.js';

import { dashboardRouter } from './routes/dashboard.routes.js';
import { projectsRouter } from './routes/projects.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { checklistRouter } from './routes/checklist.routes.js';
import { integrationsRouter } from './routes/integrations.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { executionsRouter } from './routes/executions.routes.js';
import { approvalsRouter } from './routes/approvals.routes.js';
import { diagnosticsRouter } from './routes/diagnostics.routes.js';

// Assegura migrações e seeds na inicialização do servidor
try {
  runMigrations();
  runSeeds();
} catch (err) {
  console.error('[SERVER] Erro na inicialização do banco de dados:', err);
}

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Middlewares de Segurança
app.use(helmet({
  contentSecurityPolicy: false, // permite integração visual SPA
}));

const allowedOrigin = process.env.CLIENT_ORIGIN;
app.use(cors({
  origin: allowedOrigin ? allowedOrigin : true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging simplificado sem segredos
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[HTTP] ${timestamp} ${req.method} ${req.url}`);
  next();
});

// Registro de Rotas REST da API
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/diagnostics', diagnosticsRouter);

// Rota Raiz Informativa
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'SaaS Validation Lab API',
    version: '1.0.0',
    status: 'ONLINE',
    documentation: '/docs',
    timestamp: new Date().toISOString(),
  });
});

// Servir frontend compilado (SPA) se disponível em produção
const clientDistCandidates = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
];
const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[SERVER] Frontend SPA localizado e ativo em: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // Fallback para qualquer rota que não seja /api (HTML5 PushState Routing)
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Tratamento de Erros Global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});

// Inicialização opcional de workers e orquestrador embutidos (modo all-in-one para desenvolvimento)
if (process.env.ENABLE_EMBEDDED_WORKER !== 'false') {
  import('./orchestrator/orchestrator.js').then(({ Orchestrator }) => {
    const orchestrator = new Orchestrator();
    console.log('[SERVER] Orquestrador embutido ativado (intervalo: 10s)');
    setInterval(async () => {
      try {
        await orchestrator.runCycle();
      } catch (err) {
        console.error('[EMBEDDED ORCHESTRATOR ERROR]', err);
      }
    }, parseInt(process.env.ORCHESTRATOR_INTERVAL_MS || '10000', 10));
  });

  import('./worker/worker.js').then(({ Worker }) => {
    const worker = new Worker();
    console.log('[SERVER] Worker embutido ativado (polling: 3s)');
    setInterval(async () => {
      try {
        await worker.processNextJob();
      } catch (err) {
        console.error('[EMBEDDED WORKER ERROR]', err);
      }
    }, parseInt(process.env.WORKER_POLL_INTERVAL_MS || '3000', 10));
  });
}

app.listen(Number(port), host, () => {
  console.log(`[SERVER] SaaS Validation Lab API rodando em http://${host}:${port}`);
});

export default app;
